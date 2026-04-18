// Helpers for importing student class schedules from OC's stingray API.
// The endpoint returns JSON like:
//   { Success: "True", Email, Courses: [{ CourseName, meeting_times: [{days, start_time, end_time}], ... }] }
// This module is campus-network-only — calls from off-campus will hit a
// connect timeout / refused, which we surface as a friendly error upstream.

import https from "https";

// Default base URL is OC's stingray; override via env for dev/staging.
const STINGRAY_BASE_URL = process.env.STINGRAY_BASE_URL || "https://stingray.oc.edu";
const FETCH_TIMEOUT_MS  = 8000;

// Map stingray day codes to the model's ENUM day names. "TH" must be
// checked before "T" — order-sensitive.
const DAY_CODE_MAP = {
    SU: "Sunday",
    M:  "Monday",
    TU: "Tuesday",     // belt-and-suspenders in case the API ever uses TU
    TH: "Thursday",
    T:  "Tuesday",
    W:  "Wednesday",
    F:  "Friday",
    SA: "Saturday",
    S:  "Saturday",    // fallback — stingray samples haven't shown S for Sat,
                       // but this is a reasonable interpretation
};

const READABLE_TO_CODE_SEASON = { Fall: "FA", Spring: "SP", Summer: "SU" };
const CODE_TO_READABLE_SEASON = { FA: "Fall", SP: "Spring", SU: "Summer" };

// "Fall 2020" → "2020FA". Empty/unknown input returns null so callers can
// fall back to a date-based calculation.
export function readableSeasonToCode(readable) {
    if (!readable) return null;
    const m = readable.trim().match(/^(Fall|Spring|Summer)\s+(\d{4})$/i);
    if (!m) return null;
    const word = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
    const code = READABLE_TO_CODE_SEASON[word];
    if (!code) return null;
    return `${m[2]}${code}`;
}

// "2020FA" → "Fall 2020". Returns null on unrecognized input.
export function codeToReadableSeason(code) {
    if (!code) return null;
    const m = String(code).trim().match(/^(\d{4})(FA|SP|SU)$/i);
    if (!m) return null;
    const word = CODE_TO_READABLE_SEASON[m[2].toUpperCase()];
    if (!word) return null;
    return `${word} ${m[1]}`;
}

// Today → best-guess stingray code. Jan–May = Spring, Jun–Jul = Summer,
// Aug–Dec = Fall. Used only when the dept hasn't configured active-season.
export function todayToStingrayCode(now = new Date()) {
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    if (m >= 1 && m <= 5)  return `${y}SP`;
    if (m >= 6 && m <= 7)  return `${y}SU`;
    return `${y}FA`;
}

// Convert "11:00AM" / "01:40PM" / "12:00PM" to "HH:mm:00". Defensive
// against trailing spaces and lowercase am/pm.
export function parseStingrayTime(str) {
    if (!str) return null;
    const m = String(str).trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (!m) return null;
    let hour = parseInt(m[1], 10);
    const minute = parseInt(m[2], 10);
    const meridiem = m[3].toUpperCase();
    if (meridiem === "AM" && hour === 12) hour = 0;
    else if (meridiem === "PM" && hour < 12) hour += 12;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

// Map a day code ("M", "TH", etc.) to the model's day-name enum value.
// Unknown codes return null so the caller can skip them.
export function dayCodeToDayName(code) {
    if (!code) return null;
    const upper = String(code).trim().toUpperCase();
    return DAY_CODE_MAP[upper] || null;
}

// Fan out the stingray course list into row-ready unavailability objects.
// One row per (course, meeting_time block, day) so the weekly grid can
// render each slot independently.
export function coursesToUnavailabilityRows(courses, { id_employee, seasonReadable }) {
    if (!Array.isArray(courses)) return [];
    const rows = [];
    for (const course of courses) {
        const label = buildCourseLabel(course);
        if (!Array.isArray(course.meeting_times)) continue;
        for (const mt of course.meeting_times) {
            const start = parseStingrayTime(mt.start_time);
            const end   = parseStingrayTime(mt.end_time);
            if (!start || !end) continue;
            const days = Array.isArray(mt.days) ? mt.days : [];
            for (const dayCode of days) {
                const dayName = dayCodeToDayName(dayCode);
                if (!dayName) continue;
                rows.push({
                    id_employee,
                    dayOfWeek:  dayName,
                    startTime:  start,
                    endTime:    end,
                    scopeType:  "season",
                    season:     seasonReadable,
                    startDate:  null,
                    endDate:    null,
                    source:     "imported",
                    label,
                    hideReason: false,
                });
            }
        }
    }
    return rows;
}

// "Electromagnetic Fields" — CourseID dropped from the default label to
// keep the small calendar chip readable. If you want the code visible too,
// switch this to `${name} (${courseId})`.
function buildCourseLabel(course) {
    return course?.CourseName ? String(course.CourseName).trim() : "Class";
}

// Promise wrapper around Node's https.get. Keeps the backend dependency-
// free (no axios/node-fetch needed on Node 16). Throws distinctly-typed
// errors so the controller can translate each to a user-friendly message.
export function fetchStingrayCourses(email, semesterCode) {
    return new Promise((resolve, reject) => {
        if (!email || !semesterCode) {
            const err = new Error("Missing email or semester code.");
            err.code = "BAD_INPUT";
            return reject(err);
        }
        const path = `/api/accommodationuserschedule/${encodeURIComponent(email)}/${encodeURIComponent(semesterCode)}`;
        const url  = new URL(path, STINGRAY_BASE_URL);

        const req = https.get(url, { timeout: FETCH_TIMEOUT_MS }, (res) => {
            let buf = "";
            res.on("data", (chunk) => { buf += chunk; });
            res.on("end", () => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    const err = new Error(`Stingray returned ${res.statusCode}`);
                    err.code = "STINGRAY_HTTP";
                    err.status = res.statusCode;
                    return reject(err);
                }
                try {
                    const data = JSON.parse(buf);
                    if (data && data.Success === "False") {
                        const err = new Error(data.Message || "Stingray reported a failure.");
                        err.code = "STINGRAY_LOGICAL";
                        return reject(err);
                    }
                    resolve(data);
                } catch (parseErr) {
                    const err = new Error("Stingray returned non-JSON.");
                    err.code = "STINGRAY_PARSE";
                    reject(err);
                }
            });
        });

        req.on("timeout", () => {
            req.destroy();
            const err = new Error("Stingray request timed out.");
            err.code = "STINGRAY_TIMEOUT";
            reject(err);
        });

        req.on("error", (e) => {
            // ECONNREFUSED / ENOTFOUND off-campus → translate to a
            // recognizable code so the controller can surface a helpful
            // message ("Sync unavailable outside the campus network").
            const err = new Error(e.message || "Network error contacting stingray.");
            err.code = "STINGRAY_NETWORK";
            err.cause = e;
            reject(err);
        });
    });
}

// Friendly message mapping for controller error handling.
export function stingrayErrorMessage(err) {
    const code = err && err.code;
    if (code === "STINGRAY_NETWORK" || code === "STINGRAY_TIMEOUT") {
        return "Sync unavailable — make sure the server can reach the campus network (VPN).";
    }
    if (code === "STINGRAY_HTTP") {
        return `Stingray returned an error (HTTP ${err.status}). Check that the email and semester are valid.`;
    }
    if (code === "STINGRAY_PARSE") {
        return "Stingray returned a response the server couldn't parse.";
    }
    if (code === "STINGRAY_LOGICAL") {
        return err.message || "Stingray reported a failure.";
    }
    if (code === "BAD_INPUT") {
        return err.message;
    }
    return err.message || "Sync failed.";
}
