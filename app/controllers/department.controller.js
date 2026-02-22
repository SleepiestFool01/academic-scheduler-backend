import db from "../models/index.js";

const Department = db.department;
const exports = {};

// Create and save a new Department
exports.create = (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).send({
      message: "Missing required field: name.",
    });
  }

  Department.create({ name, description })
    .then((data) => res.status(201).send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating Department.",
      })
    );
};

// Retrieve all Departments
exports.findAll = (_req, res) => {
  Department.findAll()
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Departments.",
      })
    );
};

// Retrieve a single Department by PK
exports.findOne = (req, res) => {
  Department.findByPk(req.params.id_department)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "Department not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving Department.",
      })
    );
};

// Update a Department by PK
exports.update = (req, res) => {
  Department.update(req.body, {
    where: { id_department: req.params.id_department },
  })
    .then((num) => {
      if (num === 1 || (Array.isArray(num) && num[0] === 1)) {
        return res.send({ message: "Department updated successfully." });
      }
      return res
        .status(404)
        .send({ message: "Department not found or body empty." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating Department.",
      })
    );
};

// Delete a Department by PK
exports.delete = (req, res) => {
  Department.destroy({
    where: { id_department: req.params.id_department },
  })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "Department not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting Department.",
      })
    );
};

export default exports;
