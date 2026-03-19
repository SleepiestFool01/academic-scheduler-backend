import db from "../models/index.js";

const TemplateApplication = db.templateApplication;
const TemplateApplicationShift = db.templateApplicationShift;
const exports = {};

exports.create = (req, res) => {
  const { id_template, startDate, endDate } = req.body;
  if (!id_template || !startDate || !endDate) {
    return res.status(400).send({ message: "Missing required fields: id_template, startDate, endDate." });
  }
  TemplateApplication.create({ id_template, startDate, endDate })
    .then((data) => res.status(201).send(data))
    .catch((err) => res.status(500).send({ message: err.message || "Error creating TemplateApplication." }));
};

exports.findAll = (req, res) => {
  const where = {};
  if (req.query.id_template) where.id_template = req.query.id_template;
  TemplateApplication.findAll({ where, order: [["createdAt", "DESC"]] })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message || "Error retrieving TemplateApplications." }));
};

// ── TemplateApplicationShift ──────────────────────────────────────────────────

exports.createShiftLink = (req, res) => {
  const { id_templateApplication, id_templateShift, id_shift, date } = req.body;
  if (!id_templateApplication || !id_templateShift || !id_shift || !date) {
    return res.status(400).send({ message: "Missing required fields." });
  }
  TemplateApplicationShift.create({ id_templateApplication, id_templateShift, id_shift, date })
    .then((data) => res.status(201).send(data))
    .catch((err) => res.status(500).send({ message: err.message || "Error creating TemplateApplicationShift." }));
};

exports.findShiftLinks = (req, res) => {
  const where = {};
  if (req.query.id_templateApplication) where.id_templateApplication = req.query.id_templateApplication;
  if (req.query.id_templateShift)       where.id_templateShift       = req.query.id_templateShift;
  TemplateApplicationShift.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message || "Error retrieving TemplateApplicationShifts." }));
};

export default exports;
