import db from "../models/index.js";

const TaskList = db.taskList;
const exports = {};

// Create and save a new TaskList
exports.create = (req, res) => {
  const { name, description, id_task } = req.body;

  if (!name) {
    return res.status(400).send({
      message: "Missing required field: name.",
    });
  }

  TaskList.create({ name, description, id_task })
    .then((data) => res.status(201).send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating TaskList.",
      })
    );
};

// Retrieve all TaskLists
exports.findAll = (_req, res) => {
  TaskList.findAll()
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving TaskLists.",
      })
    );
};

// Retrieve a single TaskList by PK
exports.findOne = (req, res) => {
  TaskList.findByPk(req.params.id_taskList)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "TaskList not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving TaskList.",
      })
    );
};

// Update a TaskList by PK
exports.update = (req, res) => {
  TaskList.update(req.body, {
    where: { id_taskList: req.params.id_taskList },
  })
    .then((num) => {
      if (num === 1 || (Array.isArray(num) && num[0] === 1)) {
        return res.send({ message: "TaskList updated successfully." });
      }
      return res
        .status(404)
        .send({ message: "TaskList not found or body empty." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating TaskList.",
      })
    );
};

// Delete a TaskList by PK
exports.delete = (req, res) => {
  TaskList.destroy({
    where: { id_taskList: req.params.id_taskList },
  })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "TaskList not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting TaskList.",
      })
    );
};

export default exports;
