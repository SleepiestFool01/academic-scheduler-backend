// controllers/personalAvailability.controller.js
import db from "../models/index.js";
import { Op } from "sequelize";

const PersonalAvailability = db.personal_availability;
const exports = {};

// ---------- helpers ----------
function isValidDate(value) {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

// "HH:MM" or "HH:MM:SS"
function isValidTime(value) {
  if (typeof value !== "string") return false;
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);
}

function combineDateTime(dateValue, timeStr) {
  const d = new Date(dateValue);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return new Date(`${yyyy}-${mm}-${dd}T${timeStr}`);
}

function validateBody(body) {
  const { startDate, endDate, startTime, endTime } = body ?? {};

  if (!startDate || !endDate || !startTime || !endTime) {
    return "startDate, endDate, startTime, and endTime are required.";
  }

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return "startDate and endDate must be valid dates.";
  }

  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return "startTime and endTime must be valid times (HH:MM or HH:MM:SS).";
  }

  const startDT = combineDateTime(startDate, startTime);
  const endDT = combineDateTime(endDate, endTime);

  if (startDT.getTime() >= endDT.getTime()) {
    return "Start must be before End (check date + time).";
  }

  return null;
}

async function overlapsExisting({ id_employee, startDT, endDT, excludeId = null }) {
  // Fetch candidates whose date windows overlap, then do exact overlap check in JS
  const where = {
    id_employee,
    startDate: { [Op.lte]: endDT },
    endDate: { [Op.gte]: startDT },
  };

  if (excludeId) {
    where.id_personalAvailability = { [Op.ne]: excludeId };
  }

  const candidates = await PersonalAvailability.findAll({ where });

  for (const row of candidates) {
    const rowStart = combineDateTime(row.startDate, row.startTime);
    const rowEnd = combineDateTime(row.endDate, row.endTime);

    // Overlap: existingStart < newEnd AND existingEnd > newStart
    if (rowStart < endDT && rowEnd > startDT) return true;
  }

  return false;
}

// --------------------------------------
// Create and Save a new PersonalAvailability
// POST /employees/:id_employee
// --------------------------------------
exports.createForEmployee = (req, res) => {
  const id_employee = Number.parseInt(req.params.id_employee, 10);
  if (Number.isNaN(id_employee)) {
    return res.status(400).send({ message: "id_employee is required and must be a number." });
  }

  const validationError = validateBody(req.body);
  if (validationError) {
    return res.status(400).send({ message: validationError });
  }

  const { startDate, endDate, startTime, endTime } = req.body;
  const startDT = combineDateTime(startDate, startTime);
  const endDT = combineDateTime(endDate, endTime);

  overlapsExisting({ id_employee, startDT, endDT })
    .then((overlap) => {
      if (overlap) {
        return res.status(400).send({ message: "Availability overlaps an existing record." });
      }

      return PersonalAvailability.create({
        id_employee,
        startDate,
        endDate,
        startTime,
        endTime,
      })
        .then((data) => res.status(201).send(data))
        .catch((err) =>
          res.status(500).send({
            message: err.message || "Error creating PersonalAvailability.",
          })
        );
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error checking overlap.",
      })
    );
};

// --------------------------------------
// Retrieve all PersonalAvailability for an employee
// GET /employees/:id_employee
// --------------------------------------
exports.listForEmployee = async (req, res) => {
  const id_employee = Number.parseInt(req.params.id_employee, 10);
  if (Number.isNaN(id_employee)) {
    return res.status(400).send({ message: "id_employee must be a number." });
  }

  try {
    const rows = await PersonalAvailability.findAll({
      where: { id_employee },
      order: [
        ["startDate", "ASC"],
        ["startTime", "ASC"],
      ],
    });

    res.send(rows);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving PersonalAvailability.",
    });
  }
};

// --------------------------------------
// Retrieve a single PersonalAvailability for an employee
// GET /employees/:id_employee/:id
// --------------------------------------
exports.getOneForEmployee = (req, res) => {
  const id_employee = Number.parseInt(req.params.id_employee, 10);
  const id = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(id_employee) || Number.isNaN(id)) {
    return res.status(400).send({ message: "id_employee and id must be numbers." });
  }

  PersonalAvailability.findOne({
    where: {
      id_employee,
      id_personalAvailability: id,
    },
  })
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({ message: "PersonalAvailability not found." });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving PersonalAvailability.",
      })
    );
};

// --------------------------------------
// Update PersonalAvailability for an employee
// PUT /employees/:id_employee/:id
// --------------------------------------
exports.updateForEmployee = async (req, res) => {
  const id_employee = Number.parseInt(req.params.id_employee, 10);
  const id = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(id_employee) || Number.isNaN(id)) {
    return res.status(400).send({ message: "id_employee and id must be numbers." });
  }

  try {
    const existing = await PersonalAvailability.findOne({
      where: { id_employee, id_personalAvailability: id },
    });

    if (!existing) {
      return res.status(404).send({ message: "PersonalAvailability not found." });
    }

    // Merge to support partial body even though route uses PUT
    const merged = {
      startDate: req.body.startDate ?? existing.startDate,
      endDate: req.body.endDate ?? existing.endDate,
      startTime: req.body.startTime ?? existing.startTime,
      endTime: req.body.endTime ?? existing.endTime,
    };

    const validationError = validateBody(merged);
    if (validationError) {
      return res.status(400).send({ message: validationError });
    }

    const startDT = combineDateTime(merged.startDate, merged.startTime);
    const endDT = combineDateTime(merged.endDate, merged.endTime);

    const overlap = await overlapsExisting({
      id_employee,
      startDT,
      endDT,
      excludeId: id,
    });

    if (overlap) {
      return res.status(400).send({ message: "Updated availability overlaps an existing record." });
    }

    const [num] = await PersonalAvailability.update(merged, {
      where: { id_employee, id_personalAvailability: id },
    });

    if (num === 1) {
      return res.send({ message: "PersonalAvailability updated successfully." });
    }

    return res.status(404).send({ message: "PersonalAvailability not found or body empty." });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error updating PersonalAvailability.",
    });
  }
};

// --------------------------------------
// Delete PersonalAvailability for an employee
// DELETE /employees/:id_employee/:id
// --------------------------------------
exports.deleteForEmployee = (req, res) => {
  const id_employee = Number.parseInt(req.params.id_employee, 10);
  const id = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(id_employee) || Number.isNaN(id)) {
    return res.status(400).send({ message: "id_employee and id must be numbers." });
  }

  PersonalAvailability.destroy({
    where: { id_employee, id_personalAvailability: id },
  })
    .then((num) => {
      if (num === 1) {
        res.status(204).send();
      } else {
        res.status(404).send({ message: "PersonalAvailability not found." });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting PersonalAvailability.",
      })
    );
};

export default exports;
