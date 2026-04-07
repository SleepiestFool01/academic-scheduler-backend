import db from "../models/index.js";

const Shift = db.shift;
const exports = {};

// Create and save a new Shift.
// If the shift has an id_position, automatically assigns any TaskLists linked
// to that Position via the PositionTaskList bridge table.
exports.create = async (req, res) => {
  const { name, description, day, date, startTime, endTime, id_position, id_department } = req.body;

  if (!name || !startTime || !endTime) {
    return res.status(400).send({
      message: "Missing required fields: name, startTime, endTime.",
    });
  }

  try {
    const shift = await Shift.create({
      name, description, day, date, startTime, endTime,
      id_position:   id_position   ?? null,
      id_department: id_department ?? null,
    });

    // Auto-assign task lists linked to this position
    if (id_position) {
      const positionTaskLists = await db.positionTaskList.findAll({
        where: { id_position },
      });

      for (const ptl of positionTaskLists) {
        const existing = await db.shiftTaskList.findOne({
          where: { id_shift: shift.id_shift, id_taskList: ptl.id_taskList },
        });
        if (existing) continue;

        const stl = await db.shiftTaskList.create({
          id_shift:    shift.id_shift,
          id_taskList: ptl.id_taskList,
        });

        const tasks = await db.task.findAll({ where: { id_taskList: ptl.id_taskList } });
        if (tasks.length > 0) {
          await db.shiftTaskListStatus.bulkCreate(
            tasks.map((t) => ({
              id_shiftTaskList: stl.id_shiftTaskList,
              id_task:          t.id_task,
              isCompleted:      false,
            }))
          );
        }
      }
    }

    res.status(201).send(shift);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error creating Shift.",
    });
  }
};

// Retrieve all Shifts
exports.findAll = (req, res) => {
  const { id_department } = req.query;
  const where = id_department ? { id_department } : undefined;
  Shift.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Shifts.",
      })
    );
};

// Retrieve a single Shift by PK
exports.findOne = (req, res) => {
  Shift.findByPk(req.params.id_shift)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "Shift not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Shift.",
      })
    );
};

// Update a Shift by PK
exports.update = (req, res) => {
  Shift.update(req.body, { where: { id_shift: req.params.id_shift } })
    .then((num) => {
      if (num === 1 || (Array.isArray(num) && num[0] === 1)) {
        return res.send({ message: "Shift updated successfully." });
      }
      return res
        .status(404)
        .send({ message: "Shift not found or body empty." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating Shift.",
      })
    );
};

// Delete a Shift by PK
exports.delete = (req, res) => {
  Shift.destroy({ where: { id_shift: req.params.id_shift } })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "Shift not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting Shift.",
      })
    );
};

export default exports;
