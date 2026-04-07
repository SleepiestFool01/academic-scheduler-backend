// controllers/task.controller.js
import db from "../models/index.js";

const Task = db.task;
const exports = {};

// Create and Save a new Task
exports.create = (req, res) => {
  const { name, description, id_taskList } = req.body;

  if (!name) {
    return res.status(400).send({
      message: "Missing required field: name.",
    });
  }

  Task.create({ name, description, id_taskList: id_taskList ?? null })
    .then((data) => res.status(201).send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating the Task.",
      })
    );
};

// Retrieve all Tasks (optionally filtered by ?id_taskList=X)
exports.findAll = (req, res) => {
  const where = {};
  if (req.query.id_taskList) where.id_taskList = req.query.id_taskList;

  Task.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Tasks.",
      })
    );
};

// Retrieve all Tasks for a specific TaskList
exports.findAllForTaskList = (req, res) => {
  Task.findAll({ where: { id_taskList: req.params.id_taskList } })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Tasks.",
      })
    );
};

// Retrieve a single Task
exports.findOne = (req, res) => {
  Task.findByPk(req.params.id_task)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "Task not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving specified Task.",
      })
    );
};

// Update a Task
exports.update = (req, res) => {
  Task.update(req.body, {
    where: { id_task: req.params.id_task },
  })
    .then((num) => {
      const count = Array.isArray(num) ? num[0] : num;
      if (count === 1) return res.send({ message: "Task was updated successfully." });
      return res.status(404).send({ message: "Task not found or body empty." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating Task.",
      })
    );
};

// Delete a Task
exports.delete = (req, res) => {
  Task.destroy({
    where: { id_task: req.params.id_task },
  })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "Task not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting Task.",
      })
    );
};

export default exports;
