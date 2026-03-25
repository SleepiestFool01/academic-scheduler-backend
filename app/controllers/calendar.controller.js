import db from "../models/index.js";

const Calendar = db.calendar;
const exports = {};

// Create and save a new Calendar entry (hours of operation)
exports.create = (req, res) => {
  const { dayOfWeek, season, name, startTime, endTime, id_department } = req.body;

  if (!dayOfWeek || !name || !startTime || !endTime) {
    return res.status(400).send({
      message: "Missing required fields: dayOfWeek, name, startTime, endTime.",
    });
  }

  Calendar.create({ dayOfWeek, season: season || null, name, startTime, endTime, id_department: id_department || null })
    .then((data) => res.status(201).send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating Calendar entry.",
      })
    );
};

// Retrieve all Calendar entries — id_department required
exports.findAll = (req, res) => {
  const { id_department } = req.query;
  if (!id_department) return res.send([]);
  Calendar.findAll({ where: { id_department } })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Calendar entries.",
      })
    );
};

// Retrieve a single Calendar entry by primary key
exports.findOne = (req, res) => {
  Calendar.findByPk(req.params.id_hours_of_operation)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({ message: "Calendar entry not found." });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Calendar entry.",
      })
    );
};

// Update a Calendar entry by primary key
exports.update = (req, res) => {
  Calendar.update(req.body, {
    where: { id_hours_of_operation: req.params.id_hours_of_operation },
  })
    .then((num) => {
      if (num === 1 || (Array.isArray(num) && num[0] === 1)) {
        res.send({ message: "Calendar entry updated successfully." });
      } else {
        res.status(404).send({
          message: "Calendar entry not found or body empty.",
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating Calendar entry.",
      })
    );
};

// Delete a Calendar entry by primary key
exports.delete = (req, res) => {
  Calendar.destroy({
    where: { id_hours_of_operation: req.params.id_hours_of_operation },
  })
    .then((num) => {
      if (num === 1) {
        res.status(204).send();
      } else {
        res.status(404).send({ message: "Calendar entry not found." });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting Calendar entry.",
      })
    );
};

export default exports;
