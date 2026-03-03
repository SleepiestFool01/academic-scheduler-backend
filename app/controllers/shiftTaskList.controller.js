import db from "../models/index.js";

const ShiftTaskList       = db.shiftTaskList;
const ShiftTaskListStatus = db.shiftTaskListStatus;
const exports = {};

// Assign a TaskList to a Shift.
// Auto-creates ShiftTaskListStatus rows for every Task in the list.
exports.create = async (req, res) => {
  const { id_shift, id_taskList } = req.body;

  if (!id_shift || !id_taskList) {
    return res.status(400).send({
      message: "Missing required fields: id_shift, id_taskList.",
    });
  }

  try {
    // Prevent duplicate assignments
    const existing = await ShiftTaskList.findOne({ where: { id_shift, id_taskList } });
    if (existing) {
      return res.status(409).send({
        message: "This task list is already assigned to this shift.",
      });
    }

    // Create the assignment record
    const stl = await ShiftTaskList.create({ id_shift, id_taskList });

    // Auto-create one status row per task in the list
    const tasks = await db.task.findAll({ where: { id_taskList } });
    if (tasks.length > 0) {
      await ShiftTaskListStatus.bulkCreate(
        tasks.map((t) => ({
          id_shiftTaskList: stl.id_shiftTaskList,
          id_task:          t.id_task,
          isCompleted:      false,
        }))
      );
    }

    res.status(201).send(stl);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error creating ShiftTaskList entry.",
    });
  }
};

// Retrieve ShiftTaskList entries — filter by ?id_shift=X
exports.findAll = (req, res) => {
  const where = {};
  if (req.query.id_shift) where.id_shift = req.query.id_shift;

  ShiftTaskList.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving ShiftTaskList entries.",
      })
    );
};

// Retrieve a single ShiftTaskList entry
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

// Update a ShiftTaskList entry
exports.update = (req, res) => {
  ShiftTaskList.update(req.body, {
    where: { id_shiftTaskList: req.params.id_shiftTaskList },
  })
    .then((num) => {
      const count = Array.isArray(num) ? num[0] : num;
      if (count === 1) return res.send({ message: "ShiftTaskList entry updated successfully." });
      return res.status(404).send({ message: "ShiftTaskList entry not found or body empty." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating ShiftTaskList entry.",
      })
    );
};

// Delete a ShiftTaskList entry and its associated status rows
exports.delete = async (req, res) => {
  try {
    // Remove status rows first (guard against missing FK CASCADE on DB)
    await ShiftTaskListStatus.destroy({
      where: { id_shiftTaskList: req.params.id_shiftTaskList },
    });

    const num = await ShiftTaskList.destroy({
      where: { id_shiftTaskList: req.params.id_shiftTaskList },
    });

    if (num === 1) return res.status(204).send();
    return res.status(404).send({ message: "ShiftTaskList entry not found." });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error deleting ShiftTaskList entry.",
    });
  }
};

export default exports;
