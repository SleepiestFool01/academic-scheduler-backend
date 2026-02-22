import db from "../models/index.js";

const Event = db.event;
const exports = {};

// Create and save a new Event
exports.create = (req, res) => {
  const { id_department, title, description, start_time, end_time, location } =
    req.body;

  if (!id_department || !title || !start_time || !end_time) {
    return res.status(400).send({
      message:
        "Missing required fields: id_department, title, start_time, end_time.",
    });
  }

  Event.create({
    id_department,
    title,
    description,
    start_time,
    end_time,
    location,
  })
    .then((data) => res.status(201).send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating Event.",
      })
    );
};

// Retrieve all Events (optionally filter by department)
exports.findAll = (req, res) => {
  const where = {};
  if (req.query.id_department) where.id_department = req.query.id_department;

  Event.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Events.",
      })
    );
};

// Retrieve a single Event by PK
exports.findOne = (req, res) => {
  Event.findByPk(req.params.id_event)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "Event not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Event.",
      })
    );
};

// Update an Event by PK
exports.update = (req, res) => {
  Event.update(req.body, { where: { id_event: req.params.id_event } })
    .then((num) => {
      if (num === 1 || (Array.isArray(num) && num[0] === 1)) {
        return res.send({ message: "Event updated successfully." });
      }
      return res.status(404).send({ message: "Event not found or body empty." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating Event.",
      })
    );
};

// Delete an Event by PK
exports.delete = (req, res) => {
  Event.destroy({ where: { id_event: req.params.id_event } })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "Event not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting Event.",
      })
    );
};

export default exports;
