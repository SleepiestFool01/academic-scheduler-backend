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

// Look up the currently-active semester name for a department using the
// Semester table (date-range-based). Falls back to the legacy
// Active Season settings value, then returns null if neither is
// configured — callers treat null as "apply all season rows" (lenient).
async function getActiveSeasonForDept(id_department) {
  if (!id_department) return null;
  // Preferred path: Semester table with date bounds containing today.
  try {
    const today = todayKey();
    const sem = await Semester.findOne({
      where: {
        id_department,
        startDate: { [Op.lte]: today },
        endDate:   { [Op.gte]: today },
      },
      order: [["startDate", "DESC"]],
    });
    if (sem?.name) return sem.name;
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
    return sv?.value || null;
  } catch (_) {
    return null;
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

  const activeSeason = options.activeSeason !== undefined
    ? options.activeSeason
    : await getActiveSeasonForDept(options.id_department);

  return rows.filter((row) => {
    if (!row.startTime || !row.endTime) return false;
    if (row.scopeType === "season") {
      if (!seasonsMatch(activeSeason, row.season)) return false;
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
