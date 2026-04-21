import db from "../models/index.js";

const ShiftTask = db.shiftTask;
const exports = {};

// Attach a Task directly to a Shift.
exports.create = async (req, res) => {
  const { id_shift, id_task } = req.body;

  if (!id_shift || !id_task) {
    return res.status(400).send({
      message: "Missing required fields: id_shift, id_task.",
    });
  }

  try {
    const existing = await ShiftTask.findOne({ where: { id_shift, id_task } });
    if (existing) {
      return res.status(409).send({
        message: "This task is already attached to this shift.",
      });
    }
    const record = await ShiftTask.create({ id_shift, id_task, isCompleted: false });
    res.status(201).send(record);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error attaching Task to Shift.",
    });
  }
};

// Retrieve ShiftTask entries — filter by ?id_shift=X or ?id_task=X
exports.findAll = (req, res) => {
  const where = {};
  if (req.query.id_shift) where.id_shift = req.query.id_shift;
  if (req.query.id_task)  where.id_task  = req.query.id_task;

  ShiftTask.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving ShiftTask entries.",
      })
    );
};

exports.findOne = (req, res) => {
  ShiftTask.findByPk(req.params.id_shiftTask)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "ShiftTask entry not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving ShiftTask entry.",
      })
    );
};

// Update (primarily used to toggle isCompleted)
exports.update = (req, res) => {
  ShiftTask.update(req.body, {
    where: { id_shiftTask: req.params.id_shiftTask },
  })
    .then((num) => {
      const count = Array.isArray(num) ? num[0] : num;
      if (count === 1) return res.send({ message: "ShiftTask entry updated successfully." });
      return res.status(404).send({ message: "ShiftTask entry not found or body empty." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating ShiftTask entry.",
      })
    );
};

exports.delete = async (req, res) => {
  try {
    const num = await ShiftTask.destroy({
      where: { id_shiftTask: req.params.id_shiftTask },
    });
    if (num === 1) return res.status(204).send();
    return res.status(404).send({ message: "ShiftTask entry not found." });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error deleting ShiftTask entry.",
    });
  }
};

export default exports;
