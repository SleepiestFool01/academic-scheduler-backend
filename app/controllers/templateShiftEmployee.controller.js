import db from "../models/index.js";

const TemplateShiftEmployee = db.templateShiftEmployee;
const exports = {};

exports.create = (req, res) => {
  const { id_templateShift, id_employee } = req.body;
  if (!id_templateShift || !id_employee) {
    return res.status(400).send({ message: "Missing required fields: id_templateShift, id_employee." });
  }
  TemplateShiftEmployee.create({ id_templateShift, id_employee })
    .then((data) => res.status(201).send(data))
    .catch((err) => res.status(500).send({ message: err.message || "Error creating TemplateShiftEmployee." }));
};

exports.findAll = (req, res) => {
  const where = {};
  if (req.query.id_templateShift) where.id_templateShift = req.query.id_templateShift;
  TemplateShiftEmployee.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message || "Error retrieving TemplateShiftEmployees." }));
};

exports.delete = (req, res) => {
  TemplateShiftEmployee.destroy({ where: { id_templateShiftEmployee: req.params.id_templateShiftEmployee } })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "TemplateShiftEmployee not found." });
    })
    .catch((err) => res.status(500).send({ message: err.message || "Error deleting TemplateShiftEmployee." }));
};

export default exports;
