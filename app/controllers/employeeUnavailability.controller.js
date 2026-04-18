import db from "../models/index.js";

const EmployeeUnavailability = db.employeeUnavailability;
const Employee = db.employee;
const Op = db.Sequelize.Op;
const exports = {};

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
        const { id_employee, id_department } = req.query;
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

export default exports;
