// controllers/task.controller.js
import db from "../models/index.js";

const Task = db.task;
const Op = db.Sequelize.Op;
const exports = {};

// Create and Save a new Task
exports.create = (req, res) => {
  // Validate request
  if (!req.body.name || !req.body.description || !req.body.id_taskList) {
    return res.status(400).send({
      message: "Missing required fields: name, description, id_taskList.",
    });
  }

  // Save Task in the database
  Task.create(req.body)
    .then((data) => res.status(201).send(data))
    .catch((err) => 
      res.status(500).send({
        message: err.message || "Error creating the Task.",
      })
    );
};

// Retrieve all Tasks.
exports.findAll = (req, res) => {
  Task.findAll()
    .then((data) => res.send(data))
    .catch((err) => 
      res.status(500).send({
        message: err.message || "Error retrieving Tasks.",
      })
    );
};

// Retrieve all Tasks for a specific TaskList.
exports.findAllForTaskList = (req, res) => {
  Task.findAll({ where: { id_taskList: req.params.id_taskList } })
    .then(data => res.send(data))
    .catch((err) => 
      res.status(500).send({
        message: err.message || "Error retrieving Tasks.",
      })
    );
};

// Retrieve a single Task.
exports.findOne = (req, res) => {
  Task.findByPk(req.params.id_task)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: "Task not found.",
        });
      }
    })
    .catch((err) => 
      res.status(500).send({
        message: err.message || "Error retrieving specified Task.",
      })
    );
};

// Update a Task.
exports.update = (req, res) => {
  Task.update(req.body, {
    where: { id_task: req.params.id_task },
  })
    .then((num) => {
      if (num === 1) {
        res.send({
          message: "Task was updated successfully.",
        });
      } else {
        res.status(404).send({
          message: "Task not found or body empty.",
        });
      }
    })
    .catch((err) => 
      res.status(500).send({
        message: err.message || "Error updating Task.",
      })
    );
};

// Delete a Task.
exports.delete = (req, res) => {
  Task.destroy({
    where: { id_task: req.params.id_task },
  })
    .then((num) => {
      if (num === 1) {
        res.send({
          message: "Task was deleted successfully.",
        });
      } else {
        res.status(404).send({
          message: "Task not found.",
        });
      }
    })
    .catch((err) => 
      res.status(500).send({
        message: err.message || "Error deleting Task.",
      })
    );
};

export default exports;
