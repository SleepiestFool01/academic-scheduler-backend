import db from "../models/index.js";

const ShiftTaskListStatus = db.shiftTaskListStatus;
const exports = {};

// Create and save a new ShiftTaskListStatus
exports.create = (req, res) => {
  const { id_task, id_shift } = req.body;

  if (!id_task || !id_shift) {
    return res.status(400).send({
      message: "Missing required fields: id_task, id_shift.",
    });
  }

  ShiftTaskListStatus.create({ id_task, id_shift })
    .then((data) => res.status(201).send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating ShiftTaskListStatus.",
      })
    );
};

// Retrieve all ShiftTaskListStatuses
exports.findAll = (_req, res) => {
  ShiftTaskListStatus.findAll()
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving ShiftTaskListStatuses.",
      })
    );
};

// Retrieve a single ShiftTaskListStatus by PK
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

// Update a ShiftTaskListStatus by PK
exports.update = (req, res) => {
  ShiftTaskListStatus.update(req.body, {
    where: { id_shiftTaskListStatus: req.params.id_shiftTaskListStatus },
  })
    .then((num) => {
      if (num === 1 || (Array.isArray(num) && num[0] === 1)) {
        return res.send({ message: "ShiftTaskListStatus updated successfully." });
      }
      return res.status(404).send({
        message: "ShiftTaskListStatus not found or body empty.",
      });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating ShiftTaskListStatus.",
      })
    );
};

// Delete a ShiftTaskListStatus by PK
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
