import db from "../models/index.js";

const { Op } = db.Sequelize;
const TimeEntry = db.timeEntry;
const ShiftAssignment = db.shiftAssignment;
const Shift = db.shift;
const Employee = db.employee;
const Position = db.position;
const ManagerDepartment = db.managerDepartment;
const EmployeeDepartment = db.employeeDepartment;

const exports = {};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseTimeToMinutes(value) {
  if (!value) return 0;
  const [hours = "0", minutes = "0"] = String(value).split(":");
  return Number(hours) * 60 + Number(minutes);
}

function minutesBetween(startTime, endTime) {
  let diff = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

function roundWorkedMinutes(clockInAt, clockOutAt) {
  const diffMs = new Date(clockOutAt).getTime() - new Date(clockInAt).getTime();
  return Math.max(0, Math.round(diffMs / 60000));
}

async function canAccessDepartment(user, deptId) {
  if (!deptId) return true;
  if (user.role === "Admin") return true;
  if (Number(user.id_department) === Number(deptId)) return true;

  const [managerMembership, employeeMembership] = await Promise.all([
    ManagerDepartment.findOne({
      where: { id_employee: user.id_employee, id_department: deptId },
    }),
    EmployeeDepartment.findOne({
      where: { id_employee: user.id_employee, id_department: deptId },
    }),
  ]);

  return !!(managerMembership || employeeMembership);
}

async function getAssignmentForClock(req, res, assignmentId) {
  const assignment = await ShiftAssignment.findByPk(assignmentId, {
    include: [{
      model: Shift,
      as: "shift",
      include: [{ model: Position, as: "position", required: false }],
    }],
  });

  if (!assignment) {
    res.status(404).send({ message: "Shift assignment not found." });
    return null;
  }

  if (Number(assignment.id_employee) !== Number(req.user.id_employee)) {
    res.status(403).send({ message: "You can only clock time for your own assigned shifts." });
    return null;
  }

  const deptId = assignment.shift?.id_department ?? null;
  if (!(await canAccessDepartment(req.user, deptId))) {
    res.status(403).send({ message: "You do not have access to this department." });
    return null;
  }

  return assignment;
}

function serializeShiftBlock(assignment, timeEntries) {
  const shift = assignment.shift;
  const latestEntry = [...timeEntries].sort((a, b) =>
    new Date(b.clockInAt).getTime() - new Date(a.clockInAt).getTime()
  )[0] || null;

  return {
    id_shiftAssignment: assignment.id_shiftAssignment,
    id_shift: assignment.id_shift,
    date: assignment.date,
    shiftName: shift?.name || "Shift",
    startTime: shift?.startTime || null,
    endTime: shift?.endTime || null,
    scheduledMinutes: shift ? minutesBetween(shift.startTime, shift.endTime) : 0,
    positionName: shift?.position?.name || null,
    status: latestEntry?.clockOutAt ? "completed" : latestEntry ? "clocked_in" : "not_started",
    latestEntry: latestEntry ? {
      id_timeEntry: latestEntry.id_timeEntry,
      clockInAt: latestEntry.clockInAt,
      clockOutAt: latestEntry.clockOutAt,
      workedMinutes: latestEntry.workedMinutes,
    } : null,
  };
}

exports.clockIn = async (req, res) => {
  const assignmentId = Number(req.body.id_shiftAssignment);
  if (!assignmentId) {
    return res.status(400).send({ message: "id_shiftAssignment is required." });
  }

  try {
    const assignment = await getAssignmentForClock(req, res, assignmentId);
    if (!assignment) return;

    const todayKey = localDateKey();
    if (assignment.date !== todayKey) {
      return res.status(400).send({ message: "Employees can only clock in for shifts scheduled today." });
    }

    const openEntry = await TimeEntry.findOne({
      where: {
        id_employee: req.user.id_employee,
        clockOutAt: null,
      },
      order: [["clockInAt", "DESC"]],
    });
    if (openEntry) {
      return res.status(400).send({ message: "You are already clocked in to another shift." });
    }

    const existingForAssignment = await TimeEntry.findOne({
      where: { id_shiftAssignment: assignmentId, id_employee: req.user.id_employee, clockOutAt: null },
    });
    if (existingForAssignment) {
      return res.status(400).send({ message: "You are already clocked in for this shift." });
    }

    const timeEntry = await TimeEntry.create({
      id_employee: req.user.id_employee,
      id_shiftAssignment: assignmentId,
      clockInAt: new Date(),
    });

    return res.status(201).send({
      message: "Clocked in successfully.",
      entry: {
        id_timeEntry: timeEntry.id_timeEntry,
        clockInAt: timeEntry.clockInAt,
        clockOutAt: timeEntry.clockOutAt,
        workedMinutes: timeEntry.workedMinutes,
      },
      shift: serializeShiftBlock(assignment, [timeEntry]),
    });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error clocking in." });
  }
};

exports.clockOut = async (req, res) => {
  const id_timeEntry = Number(req.params.id_timeEntry);
  if (!id_timeEntry) {
    return res.status(400).send({ message: "id_timeEntry is required." });
  }

  try {
    const timeEntry = await TimeEntry.findByPk(id_timeEntry, {
      include: [{
        model: ShiftAssignment,
        as: "shiftAssignment",
        include: [{
          model: Shift,
          as: "shift",
          include: [{ model: Position, as: "position", required: false }],
        }],
      }],
    });

    if (!timeEntry) {
      return res.status(404).send({ message: "Time entry not found." });
    }
    if (Number(timeEntry.id_employee) !== Number(req.user.id_employee)) {
      return res.status(403).send({ message: "You can only clock out your own time entry." });
    }
    if (timeEntry.clockOutAt) {
      return res.status(400).send({ message: "This time entry is already clocked out." });
    }

    const clockOutAt = new Date();
    const workedMinutes = roundWorkedMinutes(timeEntry.clockInAt, clockOutAt);
    await timeEntry.update({ clockOutAt, workedMinutes });

    return res.send({
      message: "Clocked out successfully.",
      entry: {
        id_timeEntry: timeEntry.id_timeEntry,
        clockInAt: timeEntry.clockInAt,
        clockOutAt: timeEntry.clockOutAt,
        workedMinutes: timeEntry.workedMinutes,
      },
      shift: serializeShiftBlock(timeEntry.shiftAssignment, [timeEntry]),
    });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error clocking out." });
  }
};

exports.myStatus = async (req, res) => {
  try {
    const id_department = req.query.id_department ? Number(req.query.id_department) : null;
    if (!(await canAccessDepartment(req.user, id_department))) {
      return res.status(403).send({ message: "You do not have access to this department." });
    }

    const todayKey = localDateKey();
    const shiftWhere = { date: todayKey };
    if (id_department) shiftWhere.id_department = id_department;

    const assignments = await ShiftAssignment.findAll({
      where: {
        id_employee: req.user.id_employee,
        date: todayKey,
      },
      include: [{
        model: Shift,
        as: "shift",
        where: shiftWhere,
        include: [{ model: Position, as: "position", required: false }],
      }],
      order: [
        ["date", "ASC"],
        [{ model: Shift, as: "shift" }, "startTime", "ASC"],
      ],
    });

    const assignmentIds = assignments.map((assignment) => assignment.id_shiftAssignment);
    const timeEntries = assignmentIds.length
      ? await TimeEntry.findAll({
        where: { id_shiftAssignment: { [Op.in]: assignmentIds } },
        order: [["clockInAt", "DESC"]],
      })
      : [];

    const entriesByAssignment = new Map();
    for (const entry of timeEntries) {
      const key = entry.id_shiftAssignment;
      if (!entriesByAssignment.has(key)) entriesByAssignment.set(key, []);
      entriesByAssignment.get(key).push(entry);
    }

    const shifts = assignments.map((assignment) =>
      serializeShiftBlock(assignment, entriesByAssignment.get(assignment.id_shiftAssignment) || [])
    );

    return res.send({ date: todayKey, shifts });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error loading time status." });
  }
};

exports.report = async (req, res) => {
  try {
    if (req.user.role !== "Manager" && req.user.role !== "Admin") {
      return res.status(403).send({ message: "Only managers can view hours reports." });
    }

    const id_department = req.query.id_department ? Number(req.query.id_department) : null;
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 6);
    const startDate = req.query.startDate || localDateKey(defaultStart);
    const endDate = req.query.endDate || localDateKey();

    if (id_department && !(await canAccessDepartment(req.user, id_department))) {
      return res.status(403).send({ message: "You do not have access to this department." });
    }

    const shiftWhere = {};
    if (id_department) shiftWhere.id_department = id_department;

    const assignments = await ShiftAssignment.findAll({
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id_employee", "fName", "lName", "email", "color"],
        },
        {
          model: Shift,
          as: "shift",
          where: shiftWhere,
          include: [{ model: Position, as: "position", required: false }],
        },
      ],
      where: { date: { [Op.between]: [startDate, endDate] } },
      order: [
        ["date", "DESC"],
        [{ model: Shift, as: "shift" }, "startTime", "DESC"],
      ],
    });

    const assignmentIds = assignments.map((assignment) => assignment.id_shiftAssignment);
    const timeEntries = assignmentIds.length
      ? await TimeEntry.findAll({
        where: { id_shiftAssignment: { [Op.in]: assignmentIds } },
        order: [["clockInAt", "DESC"]],
      })
      : [];

    const entriesByAssignment = new Map();
    for (const entry of timeEntries) {
      const key = entry.id_shiftAssignment;
      if (!entriesByAssignment.has(key)) entriesByAssignment.set(key, []);
      entriesByAssignment.get(key).push(entry);
    }

    const summaryMap = new Map();
    const itemRows = [];

    for (const assignment of assignments) {
      const employee = assignment.employee;
      const shift = assignment.shift;
      const rows = entriesByAssignment.get(assignment.id_shiftAssignment) || [];
      const workedMinutes = rows.reduce((sum, entry) => (
        sum + (entry.workedMinutes ?? (entry.clockOutAt ? roundWorkedMinutes(entry.clockInAt, entry.clockOutAt) : 0))
      ), 0);
      const scheduledMinutes = minutesBetween(shift.startTime, shift.endTime);
      const key = employee.id_employee;
      const latestEntry = rows[0] || null;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          id_employee: employee.id_employee,
          employeeName: `${employee.fName} ${employee.lName}`,
          email: employee.email,
          color: employee.color || null,
          totalWorkedMinutes: 0,
          totalScheduledMinutes: 0,
          shiftCount: 0,
        });
      }

      const summary = summaryMap.get(key);
      summary.totalWorkedMinutes += workedMinutes;
      summary.totalScheduledMinutes += scheduledMinutes;
      summary.shiftCount += 1;

      itemRows.push({
        id_shiftAssignment: assignment.id_shiftAssignment,
        id_timeEntry: latestEntry?.id_timeEntry || null,
        id_employee: employee.id_employee,
        employeeName: `${employee.fName} ${employee.lName}`,
        date: assignment.date,
        shiftName: shift.name,
        positionName: shift.position?.name || null,
        scheduledMinutes,
        workedMinutes,
        clockInAt: latestEntry?.clockInAt || null,
        clockOutAt: latestEntry?.clockOutAt || null,
      });
    }

    return res.send({
      startDate,
      endDate,
      summary: [...summaryMap.values()].sort((a, b) => b.totalWorkedMinutes - a.totalWorkedMinutes),
      entries: itemRows,
    });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error loading hours report." });
  }
};

export default exports;
