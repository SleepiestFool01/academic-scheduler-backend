import db from "../models/index.js";

const TemplateShiftTask = db.templateShiftTask;
const exports = {};

exports.create = async (req, res) => {
  const { id_templateShift, id_task } = req.body;

  if (!id_templateShift || !id_task) {
    return res.status(400).send({
      message: "Missing required fields: id_templateShift, id_task.",
    });
  }

  try {
    const existing = await TemplateShiftTask.findOne({ where: { id_templateShift, id_task } });
    if (existing) {
      return res.status(409).send({
        message: "This task is already attached to this template shift.",
      });
    }
    const record = await TemplateShiftTask.create({ id_templateShift, id_task });
    res.status(201).send(record);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error attaching Task to TemplateShift.",
    });
  }
};

exports.findAll = (req, res) => {
  const where = {};
  if (req.query.id_templateShift) where.id_templateShift = req.query.id_templateShift;
  if (req.query.id_task)          where.id_task          = req.query.id_task;

  TemplateShiftTask.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving TemplateShiftTask entries.",
      })
    );
};

exports.findOne = (req, res) => {
  TemplateShiftTask.findByPk(req.params.id_templateShiftTask)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "TemplateShiftTask entry not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving TemplateShiftTask entry.",
      })
    );
};

exports.delete = async (req, res) => {
  try {
    const num = await TemplateShiftTask.destroy({
      where: { id_templateShiftTask: req.params.id_templateShiftTask },
    });
    if (num === 1) return res.status(204).send();
    return res.status(404).send({ message: "TemplateShiftTask entry not found." });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error deleting TemplateShiftTask entry.",
    });
  }
};

export default exports;
