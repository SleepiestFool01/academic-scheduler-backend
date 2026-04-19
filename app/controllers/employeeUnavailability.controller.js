import db from "../models/index.js";
import {
    fetchStingrayCourses,
    coursesToUnavailabilityRows,
    readableSeasonToCode,
    codeToReadableSeason,
    todayToStingrayCode,
    stingrayErrorMessage,
} from "../utils/stingrayImport.js";

const EmployeeUnavailability = db.employeeUnavailability;
const Employee = db.employee;
const Op = db.Sequelize.Op;
const exports = {};

// Per-employee rate limit for imports. In-memory is fine for a single
// process; if we ever run multi-node we'd move this to Redis or a
// per-request DB column. The goal is to stop accidental double-clicks
// hammering stingray, not to defend against a motivated attacker.
const IMPORT_RATE_MS = 30 * 1000;
const lastImportByEmployee = new Map();

function tooSoon(id_employee) {
    const prev = lastImportByEmployee.get(id_employee);
    if (!prev) return false;
    return Date.now() - prev < IMPORT_RATE_MS;
}
function markImported(id_employee) {
    lastImportByEmployee.set(id_employee, Date.now());
}

// Resolve the semester to use for this import. Accepts either a readable
// name ("Fall 2020"), a stingray code ("2020FA"), or neither — in which
// case we fall back to the dept's active-season setting, then to today's
// calendar-based guess.
async function resolveSemester(reqSemester, id_department) {
    // Caller-supplied value wins — try both formats.
    if (reqSemester) {
        const code = readableSeasonToCode(reqSemester) || reqSemester;
        const readable = codeToReadableSeason(code);
        if (readable) return { code, readable };
    }
    // Preferred fallback: the dept's active semester as defined by its
    // Semester rows (date-range-based). If today falls inside a
    // configured semester, use that name.
    if (id_department) {
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
        const sem = await db.semester.findOne({
            where: {
                id_department,
                startDate: { [Op.lte]: todayKey },
                endDate:   { [Op.gte]: todayKey },
            },
            order: [["startDate", "DESC"]],
        }).catch(() => null);
        if (sem?.name) {
            const code = readableSeasonToCode(sem.name);
            if (code) return { code, readable: sem.name };
        }
    }
    // Legacy fallback: active-season from dept settings (used for hours-
    // of-operation variants). Kept so existing deployments without
    // Semester rows configured don't lose import capability.
    if (id_department) {
        const sv = await db.settingValue.findOne({
            where: { id_department },
            include: [{
                model: db.setting,
                as: "setting",
                where: { [Op.or]: [{ name: "Active Season" }, { key: "active_season" }] },
            }],
        }).catch(() => null);
        if (sv && sv.value) {
            const code = readableSeasonToCode(sv.value);
            if (code) return { code, readable: sv.value };
        }
    }
    // Last resort: today's date.
    const code = todayToStingrayCode();
    return { code, readable: codeToReadableSeason(code) };
}

// Returns true if the caller may read another employee's unavailability.
// Self always allowed; Admins always allowed; Managers only for employees
// whose primary or junction department they manage.
async function callerCanReadEmployee(caller, id_employee) {
    if (!caller || !id_employee) return false;
    if (caller.role === "Admin") return true;
    if (Number(caller.id_employee) === Number(id_employee)) return true;
    if (caller.role === "Manager") {
        const mgrDeptIds = new Set(
            (await db.managerDepartment.findAll({ where: { id_employee: caller.id_employee } }))
                .map(r => Number(r.id_department))
        );
        if (mgrDeptIds.size === 0) return false;
        const target = await Employee.findByPk(id_employee, { attributes: ["id_employee", "id_department"] });
        if (!target) return false;
        if (target.id_department && mgrDeptIds.has(Number(target.id_department))) return true;
        const empDeptIds = new Set(
            (await db.employeeDepartment.findAll({ where: { id_employee } }))
                .map(r => Number(r.id_department))
        );
        for (const d of empDeptIds) if (mgrDeptIds.has(d)) return true;
    }
    return false;
}

// Returns true if the caller may read unavailability rows scoped to a
// department. Admins anywhere; Managers only for departments they're
// assigned to.
async function callerCanReadDepartment(caller, id_department) {
    if (!caller || !id_department) return false;
    if (caller.role === "Admin") return true;
    if (caller.role === "Manager") {
        const mgr = await db.managerDepartment.findOne({
            where: { id_employee: caller.id_employee, id_department },
        });
        return !!mgr;
    }
    return false;
}

// Returns true if the caller is allowed to trigger an import for
// `targetEmployee`. Employees can self-sync; Admins can sync anyone;
// Managers can sync employees in departments they manage.
async function callerCanImportFor(caller, targetEmployee) {
    if (!caller || !targetEmployee) return false;
    if (caller.role === "Admin") return true;
    if (Number(caller.id_employee) === Number(targetEmployee.id_employee)) return true;
    if (caller.role === "Manager") {
        const mgrDeptIds = new Set(
            (await db.managerDepartment.findAll({ where: { id_employee: caller.id_employee } }))
                .map(r => Number(r.id_department))
        );
        if (targetEmployee.id_department && mgrDeptIds.has(Number(targetEmployee.id_department))) return true;
        const empDeptIds = new Set(
            (await db.employeeDepartment.findAll({ where: { id_employee: targetEmployee.id_employee } }))
                .map(r => Number(r.id_department))
        );
        for (const d of empDeptIds) if (mgrDeptIds.has(d)) return true;
    }
    return false;
}

// Core import routine — fetch from stingray, wipe existing imported rows
// for this (employee, season) pair, and insert the parsed rows fresh. Not
// an Express handler; both the single- and bulk-endpoint controllers call
// this. Returns { inserted, semester } or throws.
async function runImportForEmployee(employee, semesterCode, semesterReadable) {
    if (!employee?.email) {
        const err = new Error("Employee has no email on file — cannot sync.");
        err.code = "BAD_INPUT";
        throw err;
    }
    const data = await fetchStingrayCourses(employee.email, semesterCode);
    const rows = coursesToUnavailabilityRows(data.Courses, {
        id_employee:    employee.id_employee,
        seasonReadable: semesterReadable,
    });

    // Upsert semantics: drop every imported row for this (employee, season)
    // first, then insert the new set. Manual rows and rows from other
    // seasons are untouched.
    await EmployeeUnavailability.destroy({
        where: {
            id_employee: employee.id_employee,
            source:      "imported",
            season:      semesterReadable,
        },
    });
    if (rows.length) await EmployeeUnavailability.bulkCreate(rows);
    markImported(employee.id_employee);
    return { inserted: rows.length, semester: semesterReadable };
}

// Allowed values mirror the model ENUMs — validated here so bad callers
// get a 400 instead of a Sequelize error surfacing as 500.
const DAYS   = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SCOPES = ["season", "dateRange"];
const SOURCES = ["manual", "imported"];

function stripHiddenLabels(rows, viewerId, viewerRole) {
    // Rows are Sequelize instances; unwrap to plain objects before mutating
    // so we don't accidentally update the DB when serializing.
    const isAdmin = viewerRole === "Admin";
    return rows.map((r) => {
        const plain = r.toJSON ? r.toJSON() : { ...r };
        if (plain.hideReason && !isAdmin && Number(plain.id_employee) !== Number(viewerId)) {
            plain.label = null;
        }
        return plain;
    });
}

function validateScope({ scopeType, season, startDate, endDate }) {
    if (!SCOPES.includes(scopeType)) return "scopeType must be 'season' or 'dateRange'.";
    if (scopeType === "season" && !season) return "season is required when scopeType is 'season'.";
    if (scopeType === "dateRange") {
        if (!startDate || !endDate) return "startDate and endDate are required when scopeType is 'dateRange'.";
        if (startDate > endDate) return "endDate must be on or after startDate.";
    }
    return null;
}

// Retrieve rows. Accepts ?id_employee=X and/or ?id_department=Y. Managers
// typically pass id_department; the Availability page passes id_employee.
exports.findAll = async (req, res) => {
    try {
        const caller = req.user;
        if (!caller) return res.status(401).send({ message: "Unauthorized." });

        const { id_employee, id_department } = req.query;

        // Authorization: a non-Admin must either be reading their own rows
        // or rows belonging to a department/employee they manage. Without a
        // filter we'd otherwise return every employee's schedule in the DB,
        // so default an unscoped non-Admin query to the caller's own rows.
        if (id_department) {
            const ok = await callerCanReadDepartment(caller, Number(id_department));
            if (!ok) return res.status(403).send({ message: "Not allowed to view this department's unavailability." });
        }
        if (id_employee) {
            const ok = await callerCanReadEmployee(caller, Number(id_employee));
            if (!ok) return res.status(403).send({ message: "Not allowed to view this employee's unavailability." });
        }
        if (!id_employee && !id_department && caller.role !== "Admin") {
            const rows = await EmployeeUnavailability.findAll({
                where: { id_employee: caller.id_employee },
                order: [["dayOfWeek", "ASC"], ["startTime", "ASC"]],
            });
            return res.send(stripHiddenLabels(rows, caller.id_employee, caller.role));
        }

        const where = {};
        if (id_employee) where.id_employee = id_employee;

        if (id_department) {
            // Employees in the dept, via primary or junction — mirrors the
            // expansion employee.controller.js uses so visibility is
            // consistent across endpoints.
            const junctionRows = await db.employeeDepartment.findAll({ where: { id_department } });
            const junctionEmpIds = junctionRows.map(r => r.id_employee);
            const empRows = await Employee.findAll({
                where: {
                    [Op.or]: [
                        { id_department },
                        ...(junctionEmpIds.length ? [{ id_employee: { [Op.in]: junctionEmpIds } }] : []),
                    ],
                },
                attributes: ["id_employee"],
            });
            const empIds = empRows.map(e => e.id_employee);
            where.id_employee = empIds.length ? { [Op.in]: empIds } : -1;
        }

        const rows = await EmployeeUnavailability.findAll({ where, order: [["dayOfWeek", "ASC"], ["startTime", "ASC"]] });
        const viewerId = req.user?.id_employee;
        const viewerRole = req.user?.role;
        return res.send(stripHiddenLabels(rows, viewerId, viewerRole));
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error retrieving unavailability." });
    }
};

exports.create = async (req, res) => {
    try {
        const caller = req.user;
        if (!caller) return res.status(401).send({ message: "Unauthorized." });

        const body = req.body || {};
        const targetEmployeeId = Number(body.id_employee);
        if (!targetEmployeeId) return res.status(400).send({ message: "id_employee is required." });

        const isAdmin = caller.role === "Admin";
        const isSelf  = Number(caller.id_employee) === targetEmployeeId;
        if (!isAdmin && !isSelf) {
            return res.status(403).send({ message: "You can only manage your own unavailability." });
        }

        // Non-admins can only create manual rows. The import endpoint (future)
        // will call this with an admin token and can set source="imported".
        const source = isAdmin ? (body.source || "manual") : "manual";
        if (!SOURCES.includes(source)) return res.status(400).send({ message: "source must be 'manual' or 'imported'." });

        if (!DAYS.includes(body.dayOfWeek)) return res.status(400).send({ message: "dayOfWeek must be a day name." });
        if (!body.startTime || !body.endTime) return res.status(400).send({ message: "startTime and endTime are required." });

        const scopeType = body.scopeType || "season";
        // Imported rows are semester-bound by nature — we reject any other scope
        // explicitly so a misconfigured importer can't corrupt assumptions.
        if (source === "imported" && scopeType !== "season") {
            return res.status(400).send({ message: "Imported rows must use scopeType='season'." });
        }
        const scopeErr = validateScope({
            scopeType,
            season: body.season,
            startDate: body.startDate,
            endDate: body.endDate,
        });
        if (scopeErr) return res.status(400).send({ message: scopeErr });

        const row = await EmployeeUnavailability.create({
            id_employee:  targetEmployeeId,
            dayOfWeek:    body.dayOfWeek,
            startTime:    body.startTime,
            endTime:      body.endTime,
            scopeType,
            season:       scopeType === "season"    ? (body.season || null) : null,
            startDate:    scopeType === "dateRange" ? (body.startDate || null) : null,
            endDate:      scopeType === "dateRange" ? (body.endDate   || null) : null,
            source,
            label:        body.label ?? null,
            hideReason:   !!body.hideReason,
        });
        return res.status(201).send(row);
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error creating unavailability." });
    }
};

exports.update = async (req, res) => {
    try {
        const caller = req.user;
        if (!caller) return res.status(401).send({ message: "Unauthorized." });

        const row = await EmployeeUnavailability.findByPk(req.params.id_employeeUnavailability);
        if (!row) return res.status(404).send({ message: "Unavailability not found." });

        const isAdmin = caller.role === "Admin";
        const isSelf  = Number(caller.id_employee) === Number(row.id_employee);
        if (!isAdmin && !isSelf) {
            return res.status(403).send({ message: "You can only manage your own unavailability." });
        }
        // Imported rows are not user-editable — they're rewritten by the
        // import pipeline, not patched here.
        if (!isAdmin && row.source === "imported") {
            return res.status(403).send({ message: "Imported rows can't be edited." });
        }

        const body = req.body || {};
        const scopeType = body.scopeType || row.scopeType;
        const scopeErr = validateScope({
            scopeType,
            season:    body.season    !== undefined ? body.season    : row.season,
            startDate: body.startDate !== undefined ? body.startDate : row.startDate,
            endDate:   body.endDate   !== undefined ? body.endDate   : row.endDate,
        });
        if (scopeErr) return res.status(400).send({ message: scopeErr });

        const patch = {};
        if (body.dayOfWeek    !== undefined) patch.dayOfWeek    = body.dayOfWeek;
        if (body.startTime    !== undefined) patch.startTime    = body.startTime;
        if (body.endTime      !== undefined) patch.endTime      = body.endTime;
        if (body.scopeType    !== undefined) patch.scopeType    = body.scopeType;
        patch.season    = scopeType === "season"    ? (body.season    !== undefined ? body.season    : row.season)    : null;
        patch.startDate = scopeType === "dateRange" ? (body.startDate !== undefined ? body.startDate : row.startDate) : null;
        patch.endDate   = scopeType === "dateRange" ? (body.endDate   !== undefined ? body.endDate   : row.endDate)   : null;
        if (body.label        !== undefined) patch.label        = body.label;
        if (body.hideReason   !== undefined) patch.hideReason   = !!body.hideReason;

        await row.update(patch);
        return res.send(row);
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error updating unavailability." });
    }
};

exports.delete = async (req, res) => {
    try {
        const caller = req.user;
        if (!caller) return res.status(401).send({ message: "Unauthorized." });

        const row = await EmployeeUnavailability.findByPk(req.params.id_employeeUnavailability);
        if (!row) return res.status(404).send({ message: "Unavailability not found." });

        const isAdmin = caller.role === "Admin";
        const isSelf  = Number(caller.id_employee) === Number(row.id_employee);
        if (!isAdmin && !isSelf) return res.status(403).send({ message: "You can only manage your own unavailability." });
        if (!isAdmin && row.source === "imported") return res.status(403).send({ message: "Imported rows can't be deleted." });

        await row.destroy();
        return res.status(204).send();
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error deleting unavailability." });
    }
};

// POST /employee-unavailability/import
// Body: { id_employee, semester? }
// Pulls one employee's class schedule from stingray and upserts rows.
exports.importForEmployee = async (req, res) => {
    try {
        const caller = req.user;
        if (!caller) return res.status(401).send({ message: "Unauthorized." });

        const id_employee = Number(req.body?.id_employee);
        if (!id_employee) return res.status(400).send({ message: "id_employee is required." });

        const employee = await Employee.findByPk(id_employee);
        if (!employee) return res.status(404).send({ message: "Employee not found." });

        const allowed = await callerCanImportFor(caller, employee);
        if (!allowed) return res.status(403).send({ message: "Not allowed to sync this employee." });

        if (tooSoon(id_employee)) {
            return res.status(429).send({ message: "Please wait a few seconds before syncing again." });
        }

        const { code, readable } = await resolveSemester(req.body?.semester, employee.id_department);

        try {
            const result = await runImportForEmployee(employee, code, readable);
            console.log(`[stingray] imported ${result.inserted} rows for employee ${employee.id_employee} (${employee.email}) semester ${readable}`);
            return res.send(result);
        } catch (err) {
            console.error(`[stingray] import failed for employee ${employee.id_employee}:`, err.code, err.message);
            const status = err.code === "STINGRAY_NETWORK" || err.code === "STINGRAY_TIMEOUT" ? 503 : 502;
            return res.status(status).send({ message: stingrayErrorMessage(err), code: err.code || "UNKNOWN" });
        }
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error importing unavailability." });
    }
};

// POST /employee-unavailability/import-bulk
// Body: { id_department, semester? }
// Iterates every employee visible to the dept (primary + junction) and
// imports each. Per-employee failures don't halt the batch — the
// response reports what succeeded vs. failed.
exports.importForDepartment = async (req, res) => {
    try {
        const caller = req.user;
        if (!caller) return res.status(401).send({ message: "Unauthorized." });

        const id_department = Number(req.body?.id_department);
        if (!id_department) return res.status(400).send({ message: "id_department is required." });

        // Only Admins and Managers of this specific dept can trigger a bulk sync.
        const isAdmin = caller.role === "Admin";
        let allowed = isAdmin;
        if (!allowed && caller.role === "Manager") {
            const mgr = await db.managerDepartment.findOne({
                where: { id_employee: caller.id_employee, id_department },
            });
            allowed = !!mgr;
        }
        if (!allowed) return res.status(403).send({ message: "Only Admins or Managers of this department may bulk-sync." });

        const { code, readable } = await resolveSemester(req.body?.semester, id_department);

        // Collect employees in this dept (primary + junction), dedup by id.
        const junctionRows = await db.employeeDepartment.findAll({ where: { id_department } });
        const junctionIds = junctionRows.map(r => r.id_employee);
        const employees = await Employee.findAll({
            where: {
                [Op.or]: [
                    { id_department },
                    ...(junctionIds.length ? [{ id_employee: { [Op.in]: junctionIds } }] : []),
                ],
            },
        });

        const succeeded = [];
        const failed    = [];
        for (const emp of employees) {
            // Skip employees without an email — stingray needs it.
            if (!emp.email) {
                failed.push({ id_employee: emp.id_employee, name: `${emp.fName} ${emp.lName}`, error: "No email on file" });
                continue;
            }
            try {
                const result = await runImportForEmployee(emp, code, readable);
                succeeded.push({ id_employee: emp.id_employee, name: `${emp.fName} ${emp.lName}`, inserted: result.inserted });
            } catch (err) {
                failed.push({
                    id_employee: emp.id_employee,
                    name: `${emp.fName} ${emp.lName}`,
                    error: stingrayErrorMessage(err),
                    code: err.code || "UNKNOWN",
                });
                // If stingray is unreachable, don't keep pounding — abort
                // the rest of the batch. Network failures don't get better
                // across iterations.
                if (err.code === "STINGRAY_NETWORK" || err.code === "STINGRAY_TIMEOUT") {
                    break;
                }
            }
        }

        console.log(`[stingray] bulk import dept ${id_department} semester ${readable}: ${succeeded.length} ok, ${failed.length} failed`);
        return res.send({ semester: readable, succeeded, failed });
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error running bulk import." });
    }
};

export default exports;
