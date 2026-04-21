import db from "../models/index.js";

const UserDepartmentPreferences = db.userDepartmentPreferences;

// Resolve a single notification preference for (employee, department).
// Defaults to `fallback` (true) when no row exists or the pref is missing,
// which matches pre-preferences behavior (everyone got every email).
export async function shouldNotify(id_employee, id_department, prefKey, fallback = true) {
  if (!id_employee || !id_department || !prefKey) return fallback;
  try {
    const row = await UserDepartmentPreferences.findOne({
      where: { id_employee, id_department },
      attributes: ["preferences"],
    });
    if (!row) return fallback;
    const prefs = JSON.parse(row.preferences || "{}");
    const val = prefs?.notifications?.[prefKey];
    return typeof val === "boolean" ? val : fallback;
  } catch {
    return fallback;
  }
}

// Resolve a top-level preference group (shiftReminders, managerPrefs, etc.)
// and return the full object merged with server-side defaults. Used by
// server-side logic that acts on non-notification prefs.
export async function getPrefs(id_employee, id_department, group) {
  if (!id_employee || !id_department) return {};
  try {
    const row = await UserDepartmentPreferences.findOne({
      where: { id_employee, id_department },
      attributes: ["preferences"],
    });
    if (!row) return {};
    const prefs = JSON.parse(row.preferences || "{}");
    return group ? (prefs[group] || {}) : prefs;
  } catch {
    return {};
  }
}

export default { shouldNotify, getPrefs };
