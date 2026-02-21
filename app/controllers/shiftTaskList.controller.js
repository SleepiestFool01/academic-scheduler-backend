import db from "../models/index.js";

const ShiftTaskList = db.shiftTaskList;
const exports = {};

// Create and save a new ShiftTaskList entry
exports.create = (req, res) => {
  const { id_shift, id_task } = req.body;

  if (!id_shift || !id_task) {
    return res.status(400).send({
      message: "Missing required fields: id_shift, id_task.",
    });
  }

  ShiftTaskList.create({ id_shift, id_task })
    .then((data) => res.status(201).send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating ShiftTaskList entry.",
      })
    );
};

// Retrieve all ShiftTaskList entries
exports.findAll = (_req, res) => {
  ShiftTaskList.findAll()
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving ShiftTaskList entries.",
      })
    );
};

// Retrieve a single ShiftTaskList entry by PK
exports.findOne = (req, res) => {
  ShiftTaskList.findByPk(req.params.id_shiftTaskList)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "ShiftTaskList entry not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving ShiftTaskList entry.",
      })
    );
};

// Update a ShiftTaskList entry by PK
exports.update = (req, res) => {
  ShiftTaskList.update(req.body, {
    where: { id_shiftTaskList: req.params.id_shiftTaskList },
  })
    .then((num) => {
      if (num === 1 || (Array.isArray(num) && num[0] === 1)) {
        return res.send({ message: "ShiftTaskList entry updated successfully." });
      }
      return res.status(404).send({
        message: "ShiftTaskList entry not found or body empty.",
      });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating ShiftTaskList entry.",
      })
    );
};

// Delete a ShiftTaskList entry by PK
exports.delete = (req, res) => {
  ShiftTaskList.destroy({
    where: { id_shiftTaskList: req.params.id_shiftTaskList },
  })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "ShiftTaskList entry not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting ShiftTaskList entry.",
      })
    );
};

export default exports;
