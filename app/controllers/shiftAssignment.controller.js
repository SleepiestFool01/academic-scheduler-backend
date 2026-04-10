import db from "../models/index.js";
import { sendEmail } from "../utils/mailer.js";
import { shiftAssignedEmail } from "../utils/emailTemplates.js";

const ShiftAssignment = db.shiftAssignment;
const Employee = db.employee;
const Shift = db.shift;
const Position = db.position;
const exports = {};

// Create and save a new ShiftAssignment
exports.create = (req, res) => {
  const { id_employee, id_shift, date } = req.body;

  if (!id_employee || !id_shift || !date) {
    return res.status(400).send({
      message: "Missing required fields: id_employee, id_shift, date.",
    });
  }

  ShiftAssignment.create({ id_employee, id_shift, date })
    .then(async (data) => {
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
  ShiftAssignment.update(req.body, {
    where: { id_shiftAssignment: req.params.id_shiftAssignment },
  })
    .then((num) => {
      if (num === 1 || (Array.isArray(num) && num[0] === 1)) {
        return res.send({ message: "ShiftAssignment updated successfully." });
      }
      return res
        .status(404)
        .send({ message: "ShiftAssignment not found or body empty." });
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
