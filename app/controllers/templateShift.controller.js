import db from "../models/index.js";

const TemplateShift = db.templateShift;
const exports = {};

exports.create = (req, res) => {
  const { id_template, dayOfWeek, startHour, endHour, label, notes, id_position } = req.body;

  if (!id_template || dayOfWeek === undefined || startHour === undefined || endHour === undefined) {
    return res.status(400).send({ message: "Missing required fields: id_template, dayOfWeek, startHour, endHour." });
  }
  if (endHour <= startHour) {
    return res.status(400).send({ message: "endHour must be greater than startHour." });
  }

  TemplateShift.create({ id_template, dayOfWeek, startHour, endHour, label, notes, id_position: id_position || null })
    .then((data) => res.status(201).send(data))
    .catch((err) =>
      res.status(500).send({ message: err.message || "Error creating TemplateShift." })
    );
};

exports.findAll = (req, res) => {
  const where = {};
  if (req.query.id_template) where.id_template = req.query.id_template;

  TemplateShift.findAll({ where, order: [["dayOfWeek", "ASC"], ["startHour", "ASC"]] })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({ message: err.message || "Error retrieving TemplateShifts." })
    );
};

exports.findOne = (req, res) => {
  TemplateShift.findByPk(req.params.id_templateShift)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "TemplateShift not found." });
    })
    .catch((err) =>
      res.status(500).send({ message: err.message || "Error retrieving TemplateShift." })
    );
};

exports.update = (req, res) => {
  TemplateShift.update(req.body, {
    where: { id_templateShift: req.params.id_templateShift },
  })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;
      if (affected === 1) return res.send({ message: "TemplateShift updated successfully." });
      return res.status(404).send({ message: "TemplateShift not found or body empty." });
    })
    .catch((err) =>
      res.status(500).send({ message: err.message || "Error updating TemplateShift." })
    );
};

exports.delete = (req, res) => {
  TemplateShift.destroy({ where: { id_templateShift: req.params.id_templateShift } })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "TemplateShift not found." });
    })
    .catch((err) =>
      res.status(500).send({ message: err.message || "Error deleting TemplateShift." })
    );
};

export default exports;
