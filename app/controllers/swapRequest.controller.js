import db from "../models/index.js";
import { sendEmail } from "../utils/mailer.js";
import {
  swapPostedEmail,
  swapClaimedEmail,
  swapApprovedEmail,
  swapDeniedEmail,
} from "../utils/emailTemplates.js";
import { shouldNotify } from "../utils/preferences.js";

const SwapRequest = db.swapRequest;
const ShiftAssignment = db.shiftAssignment;
const Shift = db.shift;
const Position = db.position;
const Employee = db.employee;
const ManagerDepartment = db.managerDepartment;
const PositionEmployee = db.positionEmployee;
const exports = {};

// Verify the given employee is qualified for the position attached to the
// given shift. Returns { ok: true } when allowed, otherwise an object with
// `status` and `message` describing why the action should be rejected.
// Shifts with no id_position are treated as unrestricted.
async function checkEmployeeQualifiedForShift(id_shift, id_employee) {
  const shift = await Shift.findByPk(id_shift);
  if (!shift) {
    return { ok: false, status: 404, message: "Shift not found." };
  }
  if (shift.id_position == null) {
    return { ok: true };
  }
  const qualified = await PositionEmployee.findOne({
    where: { id_position: shift.id_position, id_employee },
  });
  if (!qualified) {
    return {
      ok: false,
      status: 403,
      message:
        "Employee is not assigned to this shift's position and cannot take it.",
    };
  }
  return { ok: true };
}

// Create and save a new SwapRequest
exports.create = (req, res) => {
  const { id_shift, id_employeeRequester, id_employeeRequested, status } = req.body;

  if (!id_shift || !id_employeeRequester) {
    return res.status(400).send({
      message: "Missing required fields: id_shift, id_employeeRequester.",
    });
  }

  SwapRequest.create({
    id_shift,
    id_employeeRequester,
    id_employeeRequested,
    status, // optional; defaults to model default if not provided
  })
    .then(async (data) => {
      res.status(201).send(data);

      // Notify managers of the shift's department about the tradeboard posting
      try {
        const [shift, poster] = await Promise.all([
          Shift.findByPk(id_shift),
          Employee.findByPk(id_employeeRequester),
        ]);
        if (shift && poster && shift.id_department) {
          const pos = shift.id_position ? await Position.findByPk(shift.id_position) : null;
          const mgrDepts = await ManagerDepartment.findAll({
            where: { id_department: shift.id_department },
          });
          const mgrIds = mgrDepts.map((md) => md.id_employee);
          if (mgrIds.length) {
            const managers = await Employee.findAll({ where: { id_employee: mgrIds } });
            for (const mgr of managers) {
              const notify = await shouldNotify(mgr.id_employee, shift.id_department, "newSwapRequest");
              if (!notify) continue;
              sendEmail(
                mgr.email,
                "Shift posted to tradeboard",
                swapPostedEmail(
                  `${mgr.fName} ${mgr.lName}`,
                  `${poster.fName} ${poster.lName}`,
                  shift.date || "N/A",
                  shift.startTime,
                  pos ? pos.name : null
                )
              ).catch(console.error);
            }
          }
        }
      } catch (emailErr) {
        console.error("[swapRequest.create] Email notification error:", emailErr.message);
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating SwapRequest.",
      })
    );
};

// Retrieve all SwapRequests
exports.findAll = (_req, res) => {
  SwapRequest.findAll()
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving SwapRequests.",
      })
    );
};

// Retrieve a single SwapRequest by PK
exports.findOne = (req, res) => {
  SwapRequest.findByPk(req.params.id_swapRequest)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "SwapRequest not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving SwapRequest.",
      })
    );
};

// Update a SwapRequest by PK
exports.update = async (req, res) => {
  try {
    const id_swapRequest = req.params.id_swapRequest;
    const swap = await SwapRequest.findByPk(id_swapRequest);
    if (!swap) {
      return res.status(404).send({ message: "SwapRequest not found." });
    }

    // If an employee is claiming this shift (id_employeeRequested is being
    // set in the request body), verify they are qualified for the shift's
    // position before persisting anything.
    if (
      Object.prototype.hasOwnProperty.call(req.body, "id_employeeRequested") &&
      req.body.id_employeeRequested != null
    ) {
      const check = await checkEmployeeQualifiedForShift(
        swap.id_shift,
        req.body.id_employeeRequested
      );
      if (!check.ok) {
        return res.status(check.status).send({ message: check.message });
      }
    }

    // If a manager is approving the swap, re-verify the claimant is still
    // qualified (a manager could have removed them from the position
    // between claim and approval).
    if (req.body.status === "Approved") {
      const targetEmployee =
        req.body.id_employeeRequested != null
          ? req.body.id_employeeRequested
          : swap.id_employeeRequested;
      if (!targetEmployee) {
        return res.status(400).send({
          message: "Cannot approve swap: no employee has claimed this shift.",
        });
      }
      const check = await checkEmployeeQualifiedForShift(
        swap.id_shift,
        targetEmployee
      );
      if (!check.ok) {
        return res.status(check.status).send({ message: check.message });
      }
    }

    await swap.update(req.body);

    // When a manager approves the swap, actually reassign the shift from
    // the requester to the requested employee.
    if (req.body.status === "Approved") {
      const targetEmployee = swap.id_employeeRequested;
      if (!targetEmployee) {
        return res.status(400).send({
          message: "Cannot approve swap: no employee has claimed this shift.",
        });
      }

      const assignment = await ShiftAssignment.findOne({
        where: {
          id_shift: swap.id_shift,
          id_employee: swap.id_employeeRequester,
        },
      });

      if (!assignment) {
        return res.status(404).send({
          message: "Shift assignment for requester not found.",
        });
      }

      assignment.id_employee = targetEmployee;
      await assignment.save();
    }

    // ── Email notifications (non-blocking) ──
    try {
      const shift = await Shift.findByPk(swap.id_shift);
      const pos = shift && shift.id_position ? await Position.findByPk(shift.id_position) : null;
      const posName = pos ? pos.name : null;
      const shiftTime = shift ? shift.startTime : "N/A";
      const shiftDate = shift ? (shift.date || "N/A") : "N/A";

      // Claimed: notify the original poster
      if (
        Object.prototype.hasOwnProperty.call(req.body, "id_employeeRequested") &&
        req.body.id_employeeRequested != null
      ) {
        const [poster, claimer] = await Promise.all([
          Employee.findByPk(swap.id_employeeRequester),
          Employee.findByPk(req.body.id_employeeRequested),
        ]);
        if (poster && claimer) {
          const notify = await shouldNotify(poster.id_employee, shift?.id_department, "swapDecision");
          if (notify) {
            sendEmail(
              poster.email,
              "Your shift was claimed",
              swapClaimedEmail(
                `${poster.fName} ${poster.lName}`,
                `${claimer.fName} ${claimer.lName}`,
                shiftDate,
                shiftTime,
                posName
              )
            ).catch(console.error);
          }
        }
      }

      // Approved: notify both employees
      if (req.body.status === "Approved") {
        const [requester, requested] = await Promise.all([
          Employee.findByPk(swap.id_employeeRequester),
          Employee.findByPk(swap.id_employeeRequested),
        ]);
        if (requester && await shouldNotify(requester.id_employee, shift?.id_department, "swapDecision")) {
          sendEmail(
            requester.email,
            "Swap approved",
            swapApprovedEmail(`${requester.fName} ${requester.lName}`, shiftDate, shiftTime, posName)
          ).catch(console.error);
        }
        if (requested && await shouldNotify(requested.id_employee, shift?.id_department, "swapDecision")) {
          sendEmail(
            requested.email,
            "Swap approved",
            swapApprovedEmail(`${requested.fName} ${requested.lName}`, shiftDate, shiftTime, posName)
          ).catch(console.error);
        }
      }

      // Denied: notify the requester
      if (req.body.status === "Denied") {
        const requester = await Employee.findByPk(swap.id_employeeRequester);
        if (requester && await shouldNotify(requester.id_employee, shift?.id_department, "swapDecision")) {
          sendEmail(
            requester.email,
            "Swap denied",
            swapDeniedEmail(`${requester.fName} ${requester.lName}`, shiftDate, shiftTime, posName)
          ).catch(console.error);
        }
      }
    } catch (emailErr) {
      console.error("[swapRequest.update] Email notification error:", emailErr.message);
    }

    return res.send({ message: "SwapRequest updated successfully." });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error updating SwapRequest.",
    });
  }
};

// Delete a SwapRequest by PK
exports.delete = (req, res) => {
  SwapRequest.destroy({
    where: { id_swapRequest: req.params.id_swapRequest },
  })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "SwapRequest not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting SwapRequest.",
      })
    );
};

export default exports;
