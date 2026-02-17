import db from "../models/index.js";

const Position = db.position;
const exports = {};

/**
 * Expected fields (based on your ERD):
 * - id_position (PK, usually auto)
 * - name
 * - avgPayRate
 * - id_department (FK)
 */

// Create and Save a new Position
exports.create = async (req, res) => {
  try {
    const { name, avgPayRate, id_department } = req.body;

    if (!name || !id_department) {
      return res.status(400).send({
        message: "Missing required fields: name, id_department.",
      });
    }

    const newPosition = await Position.create({
      name,
      avgPayRate, // optional
      id_department,
    });

    return res.status(201).send(newPosition);
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error creating Position.",
    });
  }
};

// Retrieve all Positions (optionally filter by department)
exports.findAll = async (req, res) => {
  try {
    const { id_department } = req.query;

    const where = {};
    if (id_department) where.id_department = id_department;

    const positions = await Position.findAll({ where });
    return res.send(positions);
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error retrieving Positions.",
    });
  }
};

// Retrieve all Positions for a specific Department
exports.findAllForDepartment = async (req, res) => {
  try {
    const { id_department } = req.params;

    const positions = await Position.findAll({
      where: { id_department },
    });

    return res.send(positions);
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error retrieving Positions for department.",
    });
  }
};

// Retrieve a single Position by PK
exports.findOne = async (req, res) => {
  try {
    const { id_position } = req.params;

    const position = await Position.findByPk(id_position);

    if (!position) {
      return res.status(404).send({ message: "Position not found." });
    }

    return res.send(position);
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error retrieving Position.",
    });
  }
};

// Update a Position
exports.update = async (req, res) => {
  try {
    const { id_position } = req.params;

    const [numUpdated] = await Position.update(req.body, {
      where: { id_position },
    });

    if (numUpdated === 1) {
      return res.send({ message: "Position updated successfully." });
    }

    return res.status(404).send({
      message: "Position not found or body empty.",
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error updating Position.",
    });
  }
};

// Delete a Position
exports.delete = async (req, res) => {
  try {
    const { id_position } = req.params;

    const numDeleted = await Position.destroy({
      where: { id_position },
    });

    if (numDeleted === 1) {
      return res.status(204).send();
    }

    return res.status(404).send({ message: "Position not found." });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error deleting Position.",
    });
  }
};

export default exports;
