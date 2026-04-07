import db from "../models/index.js";

const PositionTaskList = db.positionTaskList;
const exports = {};

// Link a TaskList to a Position
exports.create = async (req, res) => {
  const { id_position, id_taskList } = req.body;

  if (!id_position || !id_taskList) {
    return res.status(400).send({
      message: "Missing required fields: id_position, id_taskList.",
    });
  }

  try {
    const existing = await PositionTaskList.findOne({ where: { id_position, id_taskList } });
    if (existing) {
      return res.status(409).send({
        message: "This task list is already linked to this position.",
      });
    }

    const record = await PositionTaskList.create({ id_position, id_taskList });
    res.status(201).send(record);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error creating PositionTaskList entry.",
    });
  }
};

// Retrieve entries — filter by ?id_position=X and/or ?id_taskList=X
exports.findAll = (req, res) => {
  const where = {};
  if (req.query.id_position) where.id_position = req.query.id_position;
  if (req.query.id_taskList)  where.id_taskList  = req.query.id_taskList;

  PositionTaskList.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving PositionTaskList entries.",
      })
    );
};

// Retrieve a single entry by PK
exports.findOne = (req, res) => {
  PositionTaskList.findByPk(req.params.id_positionTaskList)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "PositionTaskList entry not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving PositionTaskList entry.",
      })
    );
};

// Delete (unlink) a PositionTaskList entry
exports.delete = (req, res) => {
  PositionTaskList.destroy({
    where: { id_positionTaskList: req.params.id_positionTaskList },
  })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "PositionTaskList entry not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting PositionTaskList entry.",
      })
    );
};

export default exports;
