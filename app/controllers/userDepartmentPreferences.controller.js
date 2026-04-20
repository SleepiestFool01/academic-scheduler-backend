import db from "../models/index.js";

const UserDepartmentPreferences = db.userDepartmentPreferences;
const exports = {};

// Settings page is personal-configuration per department, so callers can
// only read/write their own row. There's no cross-user access path.

function parsePrefs(raw) {
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
}

// GET /user-department-preferences?id_department=X
// Returns the current user's preferences blob for the given department.
// If no row exists yet, returns an empty object with 200 so the client
// can render defaults without treating absence as an error.
exports.findMine = async (req, res) => {
    try {
        const caller = req.user;
        if (!caller) return res.status(401).send({ message: "Unauthorized." });

        const { id_department } = req.query;
        if (!id_department) return res.status(400).send({ message: "id_department is required." });

        const row = await UserDepartmentPreferences.findOne({
            where: { id_employee: caller.id_employee, id_department: Number(id_department) },
        });

        return res.send({
            id_employee: caller.id_employee,
            id_department: Number(id_department),
            preferences: parsePrefs(row?.preferences),
        });
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error retrieving preferences." });
    }
};

// PUT /user-department-preferences
// Body: { id_department, preferences }
// Upserts the current user's preferences for that department. The client
// always sends the full prefs object; we don't merge partials server-side
// because that would require a read-modify-write with its own race window.
exports.saveMine = async (req, res) => {
    try {
        const caller = req.user;
        if (!caller) return res.status(401).send({ message: "Unauthorized." });

        const { id_department, preferences } = req.body || {};
        if (!id_department) return res.status(400).send({ message: "id_department is required." });
        if (preferences == null || typeof preferences !== "object" || Array.isArray(preferences)) {
            return res.status(400).send({ message: "preferences must be an object." });
        }

        const serialized = JSON.stringify(preferences);

        const [row] = await UserDepartmentPreferences.findOrCreate({
            where: { id_employee: caller.id_employee, id_department: Number(id_department) },
            defaults: { preferences: serialized },
        });
        if (row.preferences !== serialized) {
            await row.update({ preferences: serialized });
        }

        return res.send({
            id_employee: caller.id_employee,
            id_department: Number(id_department),
            preferences,
        });
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error saving preferences." });
    }
};

export default exports;
