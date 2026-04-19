import db from "../models/index.js";

const Semester = db.semester;
const Op = db.Sequelize.Op;
const exports = {};

// Admins may manage any department's semesters; Managers only those of
// departments they're assigned to. Mutating a semester (especially the
// active one) silently disables season-scoped unavailability conflict
// detection, so the check has to happen on every write path.
async function callerCanManageDepartment(caller, id_department) {
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

// ISO YYYY-MM-DD for today in the server's local timezone. All Semester
// rows store DATEONLY, so comparing like-for-like avoids timezone skew.
function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

// GET /semesters?id_department=X — list, ordered by start date ascending.
// Managers use this on the Department page to add/remove semesters.
exports.findAll = async (req, res) => {
    try {
        const { id_department } = req.query;
        const where = {};
        if (id_department) where.id_department = id_department;
        const rows = await Semester.findAll({ where, order: [["startDate", "ASC"]] });
        return res.send(rows);
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error retrieving semesters." });
    }
};

// GET /semesters/active?id_department=X — whichever row contains today.
// Returns the row or 404 if the dept is between semesters (e.g. summer
// break with no Summer semester configured).
exports.findActive = async (req, res) => {
    try {
        const { id_department } = req.query;
        if (!id_department) return res.status(400).send({ message: "id_department is required." });
        const today = todayKey();
        const row = await Semester.findOne({
            where: {
                id_department,
                startDate: { [Op.lte]: today },
                endDate:   { [Op.gte]: today },
            },
            order: [["startDate", "DESC"]],
        });
        if (!row) return res.status(404).send({ message: "No active semester for today." });
        return res.send(row);
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error resolving active semester." });
    }
};

exports.create = async (req, res) => {
    try {
        const caller = req.user;
        if (!caller) return res.status(401).send({ message: "Unauthorized." });

        const { id_department, name, startDate, endDate } = req.body || {};
        if (!id_department || !name || !startDate || !endDate) {
            return res.status(400).send({ message: "id_department, name, startDate, endDate are required." });
        }
        if (startDate > endDate) {
            return res.status(400).send({ message: "endDate must be on or after startDate." });
        }
        const allowed = await callerCanManageDepartment(caller, Number(id_department));
        if (!allowed) return res.status(403).send({ message: "Not allowed to manage this department's semesters." });

        const row = await Semester.create({ id_department, name, startDate, endDate });
        return res.status(201).send(row);
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error creating semester." });
    }
};

exports.update = async (req, res) => {
    try {
        const caller = req.user;
        if (!caller) return res.status(401).send({ message: "Unauthorized." });

        const row = await Semester.findByPk(req.params.id_semester);
        if (!row) return res.status(404).send({ message: "Semester not found." });

        const allowed = await callerCanManageDepartment(caller, Number(row.id_department));
        if (!allowed) return res.status(403).send({ message: "Not allowed to manage this department's semesters." });

        const { name, startDate, endDate } = req.body || {};
        const patch = {};
        if (name       !== undefined) patch.name      = name;
        if (startDate  !== undefined) patch.startDate = startDate;
        if (endDate    !== undefined) patch.endDate   = endDate;
        const nextStart = patch.startDate ?? row.startDate;
        const nextEnd   = patch.endDate   ?? row.endDate;
        if (nextStart > nextEnd) {
            return res.status(400).send({ message: "endDate must be on or after startDate." });
        }
        await row.update(patch);
        return res.send(row);
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error updating semester." });
    }
};

exports.delete = async (req, res) => {
    try {
        const caller = req.user;
        if (!caller) return res.status(401).send({ message: "Unauthorized." });

        const row = await Semester.findByPk(req.params.id_semester);
        if (!row) return res.status(404).send({ message: "Semester not found." });

        const allowed = await callerCanManageDepartment(caller, Number(row.id_department));
        if (!allowed) return res.status(403).send({ message: "Not allowed to manage this department's semesters." });

        await row.destroy();
        return res.status(204).send();
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error deleting semester." });
    }
};

export default exports;
