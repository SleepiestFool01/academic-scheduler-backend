import db from "../models/index.js";

const Setting = db.setting;
const exports = {};

// Create and save a new Setting
exports.create = (req, res) => {
  const { name, key, type, description, code } = req.body;

  if (!type) {
    return res.status(400).send({
      message: "Missing required field: type.",
    });
  }

  Setting.create({ name: name || null, key: key || null, type, description: description || null, code: code || null })
    .then((data) => res.status(201).send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating Setting.",
      })
    );
};

// Retrieve all Settings
exports.findAll = (_req, res) => {
  Setting.findAll()
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Settings.",
      })
    );
};

// Retrieve a single Setting by PK
exports.findOne = (req, res) => {
  Setting.findByPk(req.params.id_setting)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "Setting not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Setting.",
      })
    );
};

// Update a Setting by PK
exports.update = (req, res) => {
  Setting.update(req.body, { where: { id_setting: req.params.id_setting } })
    .then((num) => {
      if (num === 1 || (Array.isArray(num) && num[0] === 1)) {
        return res.send({ message: "Setting updated successfully." });
      }
      return res
        .status(404)
        .send({ message: "Setting not found or body empty." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating Setting.",
      })
    );
};

// Delete a Setting by PK
exports.delete = (req, res) => {
  Setting.destroy({ where: { id_setting: req.params.id_setting } })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "Setting not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting Setting.",
      })
    );
};

export default exports;
