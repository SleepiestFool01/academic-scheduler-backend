import db from "../models/index.js";

const PositionEmployee = db.positionEmployee;
const Position = db.position;
const exports = {};

//If a employee is hired at multiple places on campus 
exports.findAllForEmployee = async (req, res) => {
  const id_employee = req.params.id_employee;
  try {
    const assignments = await PositionEmployee.findAll({
      where: { id_employee },
      include: [{ model: Position, as: "position" }],
    });
    res.send(assignments);
  } catch (err) {
    console.error("Error fetching employee positions", err);
    res.status(500).send({
      message: err.message || "Error retrieving positions for employee.",
    });
  }
};

// Get all employees assigned to a position (includes employee details)
exports.findAllForPosition = async (req, res) => {
  const id_position = req.params.id_position;
  try {
    const assignments = await PositionEmployee.findAll({
      where: { id_position },
      include: [{ model: db.employee, as: "employee" }],
    });
    res.send(assignments);
  } catch (err) {
    console.error("Error fetching position assignments", err);
    res.status(500).send({
      message: err.message || "Error retrieving employees for position.",
    });
  }
};

// Assign a position to a employee
exports.assignPosition = async (req, res) => {
  const { id_employee, id_position } = req.body;
  if (!id_employee || !id_position) {
    return res.status(400).send({ message: "id_employee and id_position are required." });
  }
  try {
    // Avoid duplicates
    const [assignment, created] = await PositionEmployee.findOrCreate({
      where: { id_employee, id_position },
      defaults: { id_employee, id_position },
    });
    res.send(assignment);
  } catch (err) {
    console.error("Error assigning position", err);
    res.status(500).send({
      message: err.message || "Error assigning position to employee.",
    });
  }
};

// Remove an assignment
exports.removeAssignment = async (req, res) => {
  const { id_employee, id_position } = req.params;
  try {
    const count = await PositionEmployee.destroy({ where: { id_employee, id_position } });
    if (count) return res.send({ message: "Assignment removed." });
    return res.status(404).send({ message: "Assignment not found." });
  } catch (err) {
    console.error("Error removing assignment", err);
    res.status(500).send({
      message: err.message || "Error removing position assignment.",
    });
  }
};

export default exports;
