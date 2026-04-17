import db from "../models/index.js";

const PersonalAvailability = db.personalAvailability;
const ShiftAssignment = db.shiftAssignment;
const Shift = db.shift;
const SwapRequest = db.swapRequest;
const Op = db.Sequelize.Op;

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

export async function assertEmployeeAvailableForShift(id_employee, id_shift, shiftDate) {
  const shift = await Shift.findByPk(id_shift);
  if (!shift) {
    return { ok: false, status: 404, message: "Shift not found." };
  }

  const conflicts = await findApprovedAvailabilityConflicts(
    id_employee,
    shiftDate,
    shift.startTime,
    shift.endTime
  );

  if (!conflicts.length) {
    return { ok: true, shift };
  }

  return {
    ok: false,
    status: 409,
    message: "Employee has approved time off during this shift and cannot be assigned.",
    shift,
    conflicts,
  };
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
