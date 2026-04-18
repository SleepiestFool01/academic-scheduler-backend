import db from "../models/index.js";

const Semester = db.semester;
const Op = db.Sequelize.Op;
const exports = {};

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
        const { id_department, name, startDate, endDate } = req.body || {};
        if (!id_department || !name || !startDate || !endDate) {
            return res.status(400).send({ message: "id_department, name, startDate, endDate are required." });
        }
        if (startDate > endDate) {
            return res.status(400).send({ message: "endDate must be on or after startDate." });
        }
        const row = await Semester.create({ id_department, name, startDate, endDate });
        return res.status(201).send(row);
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error creating semester." });
    }
};

exports.update = async (req, res) => {
    try {
        const row = await Semester.findByPk(req.params.id_semester);
        if (!row) return res.status(404).send({ message: "Semester not found." });
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
        const num = await Semester.destroy({ where: { id_semester: req.params.id_semester } });
        if (num === 1) return res.status(204).send();
        return res.status(404).send({ message: "Semester not found." });
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error deleting semester." });
    }
};

export default exports;
