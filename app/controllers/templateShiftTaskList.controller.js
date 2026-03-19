import db from "../models/index.js";

const TemplateShiftTaskList = db.templateShiftTaskList;
const exports = {};

exports.create = (req, res) => {
  const { id_templateShift, id_taskList } = req.body;
  if (!id_templateShift || !id_taskList) {
    return res.status(400).send({ message: "Missing required fields: id_templateShift, id_taskList." });
  }
  TemplateShiftTaskList.create({ id_templateShift, id_taskList })
    .then((data) => res.status(201).send(data))
    .catch((err) => res.status(500).send({ message: err.message || "Error creating TemplateShiftTaskList." }));
};

exports.findAll = (req, res) => {
  const where = {};
  if (req.query.id_templateShift) where.id_templateShift = req.query.id_templateShift;
  TemplateShiftTaskList.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message || "Error retrieving TemplateShiftTaskLists." }));
};

exports.delete = (req, res) => {
  TemplateShiftTaskList.destroy({ where: { id_templateShiftTaskList: req.params.id_templateShiftTaskList } })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "TemplateShiftTaskList not found." });
    })
    .catch((err) => res.status(500).send({ message: err.message || "Error deleting TemplateShiftTaskList." }));
};

export default exports;
