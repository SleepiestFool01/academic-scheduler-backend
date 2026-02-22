import db from "../models/index.js";

const SettingValue = db.settingValue;
const exports = {};

// Create and save a new SettingValue
exports.create = (req, res) => {
  const { id_setting, id_department, value } = req.body;

  if (!id_setting || !id_department || value === undefined) {
    return res.status(400).send({
      message: "Missing required fields: id_setting, id_department, value.",
    });
  }

  SettingValue.create({ id_setting, id_department, value })
    .then((data) => res.status(201).send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating SettingValue.",
      })
    );
};

// Retrieve all SettingValues
exports.findAll = (_req, res) => {
  SettingValue.findAll()
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving SettingValues.",
      })
    );
};

// Retrieve a single SettingValue by PK
exports.findOne = (req, res) => {
  SettingValue.findByPk(req.params.id_settingValue)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "SettingValue not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving SettingValue.",
      })
    );
};

// Update a SettingValue by PK
exports.update = (req, res) => {
  SettingValue.update(req.body, {
    where: { id_settingValue: req.params.id_settingValue },
  })
    .then((num) => {
      if (num === 1 || (Array.isArray(num) && num[0] === 1)) {
        return res.send({ message: "SettingValue updated successfully." });
      }
      return res
        .status(404)
        .send({ message: "SettingValue not found or body empty." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating SettingValue.",
      })
    );
};

// Delete a SettingValue by PK
exports.delete = (req, res) => {
  SettingValue.destroy({
    where: { id_settingValue: req.params.id_settingValue },
  })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "SettingValue not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting SettingValue.",
      })
    );
};

export default exports;
