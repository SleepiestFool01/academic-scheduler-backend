import db from "../models/index.js";

const Template = db.template;
const exports = {};

exports.create = (req, res) => {
  const { name, description, id_department } = req.body;

  if (!name) {
    return res.status(400).send({ message: "Missing required field: name." });
  }

  Template.create({ name, description, id_department: id_department ?? null })
    .then((data) => res.status(201).send(data))
    .catch((err) =>
      res.status(500).send({ message: err.message || "Error creating Template." })
    );
};

exports.findAll = (req, res) => {
  const { id_department } = req.query;
  if (!id_department) return res.send([]);
  const where = { id_department };
  Template.findAll({ where, order: [["createdAt", "DESC"]] })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({ message: err.message || "Error retrieving Templates." })
    );
};

exports.findOne = (req, res) => {
  Template.findByPk(req.params.id_template)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "Template not found." });
    })
    .catch((err) =>
      res.status(500).send({ message: err.message || "Error retrieving Template." })
    );
};

exports.update = (req, res) => {
  Template.update(req.body, {
    where: { id_template: req.params.id_template },
  })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;
      if (affected === 1) return res.send({ message: "Template updated successfully." });
      return res.status(404).send({ message: "Template not found or body empty." });
    })
    .catch((err) =>
      res.status(500).send({ message: err.message || "Error updating Template." })
    );
};

exports.delete = (req, res) => {
  Template.destroy({ where: { id_template: req.params.id_template } })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "Template not found." });
    })
    .catch((err) =>
      res.status(500).send({ message: err.message || "Error deleting Template." })
    );
};

export default exports;
