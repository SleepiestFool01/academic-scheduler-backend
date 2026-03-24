import db from "../models/index.js";

const Shift = db.shift;
const exports = {};

// Create and save a new Shift
exports.create = (req, res) => {
  const { name, description, day, date, startTime, endTime, id_position, id_department } = req.body;

  if (!name || !startTime || !endTime) {
    return res.status(400).send({
      message: "Missing required fields: name, startTime, endTime.",
    });
  }

  Shift.create({ name, description, day, date, startTime, endTime, id_position: id_position ?? null, id_department: id_department ?? null })
    .then((data) => res.status(201).send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating Shift.",
      })
    );
};

// Retrieve all Shifts
exports.findAll = (req, res) => {
  const { id_department } = req.query;
  const where = id_department ? { id_department } : undefined;
  Shift.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Shifts.",
      })
    );
};

// Retrieve a single Shift by PK
exports.findOne = (req, res) => {
  Shift.findByPk(req.params.id_shift)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "Shift not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Shift.",
      })
    );
};

// Update a Shift by PK
exports.update = (req, res) => {
  Shift.update(req.body, { where: { id_shift: req.params.id_shift } })
    .then((num) => {
      if (num === 1 || (Array.isArray(num) && num[0] === 1)) {
        return res.send({ message: "Shift updated successfully." });
      }
      return res
        .status(404)
        .send({ message: "Shift not found or body empty." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating Shift.",
      })
    );
};

// Delete a Shift by PK
exports.delete = (req, res) => {
  Shift.destroy({ where: { id_shift: req.params.id_shift } })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "Shift not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting Shift.",
      })
    );
};

export default exports;
