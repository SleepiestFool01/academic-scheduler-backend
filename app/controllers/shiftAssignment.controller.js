import db from "../models/index.js";
import { sendEmail } from "../utils/mailer.js";
import { shiftAssignedEmail } from "../utils/emailTemplates.js";
import { assertEmployeeAvailableForShift } from "../utils/availability.js";

const ShiftAssignment = db.shiftAssignment;
const Employee = db.employee;
const Shift = db.shift;
const Position = db.position;
const exports = {};

// Create and save a new ShiftAssignment. Pass `force: true` in the body
// to bypass a soft unavailability conflict after the caller has confirmed
// with the user. Approved time-off is always enforced regardless of force.
exports.create = (req, res) => {
  const { id_employee, id_shift, date, force } = req.body;

  if (!id_employee || !id_shift || !date) {
    return res.status(400).send({
      message: "Missing required fields: id_employee, id_shift, date.",
    });
  }

  assertEmployeeAvailableForShift(id_employee, id_shift, date, { bypassUnavailability: !!force })
    .then(async (availabilityCheck) => {
      if (!availabilityCheck.ok) {
        return res
          .status(availabilityCheck.status)
          .send({
            message: availabilityCheck.message,
            code: availabilityCheck.code,
            overridable: !!availabilityCheck.overridable,
            unavailabilityLabel: availabilityCheck.unavailabilityLabel || null,
          });
      }

      const data = await ShiftAssignment.create({ id_employee, id_shift, date });
      res.status(201).send(data);

      // Send shift-assigned email (non-blocking, errors swallowed)
      try {
        const [emp, shift] = await Promise.all([
          Employee.findByPk(id_employee),
          Shift.findByPk(id_shift),
        ]);
        if (emp && shift) {
          const pos = shift.id_position ? await Position.findByPk(shift.id_position) : null;
          sendEmail(
            emp.email,
            "You've been assigned a shift",
            shiftAssignedEmail(
              `${emp.fName} ${emp.lName}`,
              date,
              shift.startTime,
              shift.endTime,
              pos ? pos.name : null
            )
          ).catch(console.error);
        }
      } catch (emailErr) {
        console.error("[shiftAssignment] Email notification error:", emailErr.message);
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating ShiftAssignment.",
      })
    );
};

// Retrieve all ShiftAssignments
exports.findAll = (_req, res) => {
  ShiftAssignment.findAll()
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving ShiftAssignments.",
      })
    );
};

// Retrieve a single ShiftAssignment by PK
exports.findOne = (req, res) => {
  ShiftAssignment.findByPk(req.params.id_shiftAssignment)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "ShiftAssignment not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving ShiftAssignment.",
      })
    );
};

// Update a ShiftAssignment by PK
exports.update = (req, res) => {
  ShiftAssignment.findByPk(req.params.id_shiftAssignment)
    .then(async (assignment) => {
      if (!assignment) {
        return res
          .status(404)
          .send({ message: "ShiftAssignment not found or body empty." });
      }

      const nextEmployee = req.body.id_employee ?? assignment.id_employee;
      const nextShift = req.body.id_shift ?? assignment.id_shift;
      const nextDate = req.body.date ?? assignment.date;

      const availabilityCheck = await assertEmployeeAvailableForShift(
        nextEmployee,
        nextShift,
        nextDate,
        { bypassUnavailability: !!req.body.force }
      );
      if (!availabilityCheck.ok) {
        return res
          .status(availabilityCheck.status)
          .send({
            message: availabilityCheck.message,
            code: availabilityCheck.code,
            overridable: !!availabilityCheck.overridable,
            unavailabilityLabel: availabilityCheck.unavailabilityLabel || null,
          });
      }

      // Strip `force` before persisting so it never lands in the DB row.
      const { force, ...patch } = req.body;
      await assignment.update(patch);
      return res.send({ message: "ShiftAssignment updated successfully." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating ShiftAssignment.",
      })
    );
};

// Delete a ShiftAssignment by PK
exports.delete = (req, res) => {
  ShiftAssignment.destroy({
    where: { id_shiftAssignment: req.params.id_shiftAssignment },
  })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "ShiftAssignment not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting ShiftAssignment.",
      })
    );
};

export default exports;
