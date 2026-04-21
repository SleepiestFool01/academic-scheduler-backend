import db from "../models/index.js";

const PersonalAvailability   = db.personalAvailability;
const EmployeeUnavailability = db.employeeUnavailability;
const ShiftAssignment        = db.shiftAssignment;
const Shift                  = db.shift;
const SwapRequest            = db.swapRequest;
const SettingValue           = db.settingValue;
const Setting                = db.setting;
const Semester               = db.semester;
const Op                     = db.Sequelize.Op;

const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Compare an activeSeason setting ("Fall" or "Fall 2026") to a row's
// season ("Spring 2026"). Matches on semester name + year, year optional
// on either side so "Fall" still matches "Fall 2026" but not
// "Spring 2026". Returning true when `activeSeason` is empty is the
// lenient fallback — same rule the frontend uses.
function seasonsMatch(activeSeason, rowSeason) {
  if (!activeSeason) return true;
  if (!rowSeason) return false;
  const [activeSem, activeYear] = String(activeSeason).trim().split(/\s+/);
  const [rowSem,    rowYear]    = String(rowSeason).trim().split(/\s+/);
  if (!activeSem || !rowSem) return false;
  if (activeSem.toLowerCase() !== rowSem.toLowerCase()) return false;
  if (activeYear && rowYear && activeYear !== rowYear) return false;
  return true;
}

export function normalizeAvailabilityStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (value === "approved") return "Approved";
  if (value === "denied") return "Denied";
  return "Pending";
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hh = 0, mm = 0, ss = 0] = String(timeStr).split(":").map(Number);
  return hh * 60 + mm + (ss >= 30 ? 1 : 0);
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

export function availabilityOverlapsShift(availability, shiftDate, shiftStartTime, shiftEndTime) {
  if (!availability || !shiftDate || !shiftStartTime || !shiftEndTime) return false;
  if (shiftDate < availability.startDate || shiftDate > availability.endDate) return false;

  const reqStart = timeToMinutes(availability.startTime);
  const reqEnd = timeToMinutes(availability.endTime);
  const shiftStart = timeToMinutes(shiftStartTime);
  const shiftEnd = timeToMinutes(shiftEndTime);

  return rangesOverlap(reqStart, reqEnd, shiftStart, shiftEnd);
}

export async function findApprovedAvailabilityConflicts(
  id_employee,
  shiftDate,
  shiftStartTime,
  shiftEndTime,
  options = {}
) {
  const where = {
    id_employee,
    status: "Approved",
    startDate: { [Op.lte]: shiftDate },
    endDate: { [Op.gte]: shiftDate },
  };

  if (options.excludeId) {
    where.id_personalAvailability = { [Op.ne]: options.excludeId };
  }

  const requests = await PersonalAvailability.findAll({ where });
  return requests.filter((req) =>
    availabilityOverlapsShift(req, shiftDate, shiftStartTime, shiftEndTime)
  );
}

// YYYY-MM-DD for today in the server's local timezone.
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Look up the semester name that contains `forDate` (YYYY-MM-DD) for the
// given department. Falls back to today's semester, then the legacy Active
// Season setting. Returns null if nothing is configured — callers treat
// null as "apply all season rows" (lenient).
//
// Why date-scoped: a shift in Fall 2026 should be matched against Fall
// unavailability rows, NOT Spring rows, even if today is in Spring. Using
// today's semester would wrongly block Fall assignments with Spring-only
// class schedule imports.
async function getSeasonForDate(id_department, forDate) {
  if (!id_department) return { id_semester: null, name: null };
  const dateKey = forDate || todayKey();
  try {
    const sem = await Semester.findOne({
      where: {
        id_department,
        startDate: { [Op.lte]: dateKey },
        endDate:   { [Op.gte]: dateKey },
      },
      order: [["startDate", "DESC"]],
    });
    if (sem?.name) return { id_semester: sem.id_semester, name: sem.name };
  } catch (_) { /* fall through */ }
  // Legacy fallback — covers depts that haven't configured Semester rows
  // yet but still have an "Active Season" setting from earlier use.
  try {
    const sv = await SettingValue.findOne({
      where: { id_department },
      include: [{
        model: Setting,
        as: "setting",
        where: { [Op.or]: [{ name: "Active Season" }, { key: "active_season" }] },
      }],
    });
    return { id_semester: null, name: sv?.value || null };
  } catch (_) {
    return { id_semester: null, name: null };
  }
}

// Find every EmployeeUnavailability row that overlaps the given shift slot.
// Mirrors the filtering logic used on the dashboard frontend so what the
// manager sees in the picker is what the server enforces.
export async function findUnavailabilityConflicts(id_employee, shiftDate, shiftStartTime, shiftEndTime, options = {}) {
  if (!id_employee || !shiftDate || !shiftStartTime || !shiftEndTime) return [];
  const [y, m, d] = String(shiftDate).split("-").map(Number);
  const dayName = DAY_NAMES_FULL[new Date(y, m - 1, d).getDay()];

  const rows = await EmployeeUnavailability.findAll({
    where: { id_employee, dayOfWeek: dayName },
  });

  // Resolve the shift-date's semester (not today's) so Fall shifts are
  // matched against Fall unavailability, not whatever semester is active
  // right now. We carry both id and name so rows created with an
  // id_semester FK match by ID (robust to name drift), and legacy rows
  // without an FK still match by string.
  let resolvedSeason;
  if (options.activeSeason !== undefined) {
    // Legacy callers may pass just a string — normalize to the object shape.
    resolvedSeason = typeof options.activeSeason === "string" || options.activeSeason === null
      ? { id_semester: null, name: options.activeSeason }
      : options.activeSeason;
  } else {
    resolvedSeason = await getSeasonForDate(options.id_department, shiftDate);
  }
  const { id_semester: shiftSemId, name: shiftSemName } = resolvedSeason;

  return rows.filter((row) => {
    if (!row.startTime || !row.endTime) return false;
    if (row.scopeType === "season") {
      // Prefer FK match when the row has an id_semester — it's the
      // authoritative link. A row with an id_semester set to a different
      // semester than the shift's must not match even if the string name
      // happens to overlap.
      if (row.id_semester != null) {
        if (shiftSemId == null || Number(row.id_semester) !== Number(shiftSemId)) return false;
      } else {
        // Legacy row without FK — fall back to the string compare.
        if (!seasonsMatch(shiftSemName, row.season)) return false;
      }
    } else if (row.scopeType === "dateRange") {
      if (!row.startDate || !row.endDate) return false;
      if (shiftDate < row.startDate || shiftDate > row.endDate) return false;
    }
    const rowStart = timeToMinutes(row.startTime);
    const rowEnd   = timeToMinutes(row.endTime);
    return rangesOverlap(
      rowStart,
      rowEnd,
      timeToMinutes(shiftStartTime),
      timeToMinutes(shiftEndTime)
    );
  });
}

export async function assertEmployeeAvailableForShift(id_employee, id_shift, shiftDate, options = {}) {
  const shift = await Shift.findByPk(id_shift);
  if (!shift) {
    return { ok: false, status: 404, message: "Shift not found." };
  }

  // (1) Approved time off — HARD block, never overridable. A manager-
  // approved PTO window should not be silently overwritten by an
  // assignment even if the user confirms — the employee explicitly asked
  // to be off.
  const timeOffConflicts = await findApprovedAvailabilityConflicts(
    id_employee,
    shiftDate,
    shift.startTime,
    shift.endTime
  );
  if (timeOffConflicts.length) {
    return {
      ok: false,
      status: 409,
      code: "TIME_OFF",
      overridable: false,
      message: "Employee has approved time off during this shift and cannot be assigned.",
      shift,
      conflicts: timeOffConflicts,
    };
  }

  // (2) Recurring unavailability (imported class schedule + manual blocks)
  // — SOFT block. Callers can pass `bypassUnavailability: true` to
  // override after confirming with the user.
  if (!options.bypassUnavailability) {
    const unavailConflicts = await findUnavailabilityConflicts(
      id_employee,
      shiftDate,
      shift.startTime,
      shift.endTime,
      { id_department: shift.id_department }
    );
    if (unavailConflicts.length) {
      const first = unavailConflicts[0];
      const label = first.label || "Unavailable";
      return {
        ok: false,
        status: 409,
        code: "UNAVAILABILITY",
        overridable: true,
        unavailabilityLabel: label,
        message: `Employee is marked unavailable (${label}) during this shift.`,
        shift,
        conflicts: unavailConflicts,
      };
    }
  }

  return { ok: true, shift };
}

export async function releaseAssignmentsForAvailability(availability) {
  const assignments = await ShiftAssignment.findAll({
    where: {
      id_employee: availability.id_employee,
      date: {
        [Op.between]: [availability.startDate, availability.endDate],
      },
    },
    include: [
      {
        model: Shift,
        as: "shift",
      },
    ],
  });

  const releasedAssignments = [];

  for (const assignment of assignments) {
    const shift = assignment.shift;
    if (!shift) continue;
    if (!availabilityOverlapsShift(availability, assignment.date, shift.startTime, shift.endTime)) {
      continue;
    }

    const existingSwap = await SwapRequest.findOne({
      where: {
        id_shift: assignment.id_shift,
        id_employeeRequester: assignment.id_employee,
        status: "Pending",
      },
    });

    if (!existingSwap) {
      await SwapRequest.create({
        id_shift: assignment.id_shift,
        id_employeeRequester: assignment.id_employee,
        id_employeeRequested: null,
        status: "Pending",
      });
    }

    releasedAssignments.push({
      id_shiftAssignment: assignment.id_shiftAssignment,
      id_shift: assignment.id_shift,
      date: assignment.date,
    });

    await assignment.destroy();
  }

  return releasedAssignments;
}
