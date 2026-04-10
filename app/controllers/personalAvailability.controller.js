import db from "../models/index.js";
import { sendEmail } from "../utils/mailer.js";
import { timeOffRequestedEmail } from "../utils/emailTemplates.js";

const PersonalAvailability = db.personalAvailability;
const Employee = db.employee;
const ManagerDepartment = db.managerDepartment;
const exports = {};

// Create and Save a new Personal Availability
exports.create = (req, res) => {
  if (!req.body.id_employee || !req.body.startDate || !req.body.endDate || !req.body.startTime || !req.body.endTime) {
    return res.status(400).send({
      message: "Missing required fields: id_employee, startDate, endDate, startTime, endTime.",
    });
  }

  PersonalAvailability.create(req.body)
    .then(async (data) => {
      res.status(201).send(data);

      // Notify managers of the employee's department about the time-off request
      try {
        const emp = await Employee.findByPk(req.body.id_employee);
        if (emp && emp.id_department) {
          const mgrDepts = await ManagerDepartment.findAll({
            where: { id_department: emp.id_department },
          });
          const mgrIds = mgrDepts.map((md) => md.id_employee);
          if (mgrIds.length) {
            const managers = await Employee.findAll({ where: { id_employee: mgrIds } });
            for (const mgr of managers) {
              sendEmail(
                mgr.email,
                "New time-off request",
                timeOffRequestedEmail(
                  `${mgr.fName} ${mgr.lName}`,
                  `${emp.fName} ${emp.lName}`,
                  req.body.startDate,
                  req.body.endDate
                )
              ).catch(console.error);
            }
          }
        }
      } catch (emailErr) {
        console.error("[personalAvailability.create] Email notification error:", emailErr.message);
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating Personal Availability.",
      })
    );
};

// Retrieve all Personal Availability
exports.findAll = (_req, res) => {
  PersonalAvailability.findAll()
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Personal Availability.",
      })
    );
};

// Retrieve Personal Availability for a specific Employee
exports.findAllForEmployee = (req, res) => {
  PersonalAvailability.findAll({ where: { id_employee: req.params.id_employee } })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Personal Availability.",
      })
    );
};

// Retrieve a single Personal Availability
exports.findOne = (req, res) => {
  PersonalAvailability.findByPk(req.params.id_personalAvailability)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: "Personal Availability not found.",
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Personal Availability.",
      })
    );
};

// Update a Personal Availability
exports.update = (req, res) => {
  PersonalAvailability.update(req.body, {
    where: { id_personalAvailability: req.params.id_personalAvailability },
  })
    .then((num) => {
      if (num === 1) {
        res.send({ message: "Personal Availability updated successfully." });
      } else {
        res.status(404).send({
          message: "Personal Availability not found or body empty.",
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating Personal Availability.",
      })
    );
};

// Delete a Personal Availability
exports.delete = (req, res) => {
  PersonalAvailability.destroy({
    where: { id_personalAvailability: req.params.id_personalAvailability },
  })
    .then((num) => {
      if (num === 1) {
        res.status(204).send();
      } else {
        res.status(404).send({
          message: "Personal Availability not found.",
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting Personal Availability.",
      })
    );
};

export default exports;
