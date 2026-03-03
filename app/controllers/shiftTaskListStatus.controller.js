import db from "../models/index.js";

const ShiftTaskListStatus = db.shiftTaskListStatus;
const exports = {};

// Create a single status record (normally auto-created by shiftTaskList.create)
exports.create = (req, res) => {
  const { id_shiftTaskList, id_task, isCompleted } = req.body;

  if (!id_shiftTaskList || !id_task) {
    return res.status(400).send({
      message: "Missing required fields: id_shiftTaskList, id_task.",
    });
  }

  ShiftTaskListStatus.create({
    id_shiftTaskList,
    id_task,
    isCompleted: isCompleted ?? false,
  })
    .then((data) => res.status(201).send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating ShiftTaskListStatus.",
      })
    );
};

// Retrieve statuses — filter by ?id_shiftTaskList=X
exports.findAll = (req, res) => {
  const where = {};
  if (req.query.id_shiftTaskList) where.id_shiftTaskList = req.query.id_shiftTaskList;

  ShiftTaskListStatus.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving ShiftTaskListStatuses.",
      })
    );
};

// Retrieve a single ShiftTaskListStatus
exports.findOne = (req, res) => {
  ShiftTaskListStatus.findByPk(req.params.id_shiftTaskListStatus)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "ShiftTaskListStatus not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving ShiftTaskListStatus.",
      })
    );
};

// Update a ShiftTaskListStatus — primarily used to toggle isCompleted
exports.update = (req, res) => {
  ShiftTaskListStatus.update(req.body, {
    where: { id_shiftTaskListStatus: req.params.id_shiftTaskListStatus },
  })
    .then((num) => {
      const count = Array.isArray(num) ? num[0] : num;
      if (count === 1) return res.send({ message: "ShiftTaskListStatus updated successfully." });
      return res.status(404).send({ message: "ShiftTaskListStatus not found or body empty." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating ShiftTaskListStatus.",
      })
    );
};

// Delete a ShiftTaskListStatus
exports.delete = (req, res) => {
  ShiftTaskListStatus.destroy({
    where: { id_shiftTaskListStatus: req.params.id_shiftTaskListStatus },
  })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "ShiftTaskListStatus not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting ShiftTaskListStatus.",
      })
    );
};

export default exports;
