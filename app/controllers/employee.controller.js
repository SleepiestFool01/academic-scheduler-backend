import db from "../models/index.js";

const Employee = db.employee;   // was db.user — fixed throughout
const Op = db.Sequelize.Op;
const exports = {};

// Create a new Employee
exports.create = (req, res) => {
  if (!req.body.fName) {
    return res.status(400).send({ message: "Content can not be empty!" });
  }
  const employee = {
    fName: req.body.fName,
    lName: req.body.lName,
    email: req.body.email,
    bio:   req.body.bio ?? undefined,
  };
  Employee.create(employee)
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message || "Error creating Employee." }));
};

// Retrieve all employees (any role)
exports.findAll = (req, res) => {
  const id_employee = req.query.id_employee;
  const condition = id_employee
    ? { id_employee: { [Op.like]: `%${id_employee}%` } }
    : null;
  Employee.findAll({ where: condition })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message || "Error retrieving employees." }));
};

// Find all employees with role = "Employee"
exports.findAllEmployees = (req, res) => {
  Employee.findAll({ where: { role: "Employee" } })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message || "Error retrieving employees." }));
};

// Create a new employee with role forced to "Employee"
exports.createEmployee = (req, res) => {
  const employee = {
    fName: req.body.fName,
    lName: req.body.lName,
    email: req.body.email,
    role:  "Employee",
    bio:   req.body.bio ?? undefined,
  };
  Employee.create(employee)
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message || "Error creating employee." }));
};

// Find a single Employee by PK
exports.findOne = (req, res) => {
  const id_employee = req.params.id_employee;
  Employee.findByPk(id_employee)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: `Cannot find Employee with id_employee=${id_employee}.` });
    })
    .catch((err) => res.status(500).send({ message: "Error retrieving Employee with id_employee=" + id_employee }));
};

// Find a single Employee by email
exports.findByEmail = (req, res) => {
  const email = req.params.email;
  Employee.findOne({ where: { email } })
    .then((data) => {
      if (data) return res.send(data);
      return res.send({ email: "not found" });
    })
    .catch((err) => res.status(500).send({ message: "Error retrieving Employee with email=" + email }));
};

// Update an Employee
exports.update = (req, res) => {
  const id_employee = req.params.id_employee;
  Employee.update(req.body, { where: { id_employee } })
    .then((num) => {
      if (num == 1) return res.send({ message: "Employee was updated successfully." });
      return res.send({ message: `Cannot update Employee with id_employee=${id_employee}.` });
    })
    .catch((err) => res.status(500).send({ message: "Error updating Employee with id_employee=" + id_employee }));
};

console.log("update reached");

// Update role only
exports.updateRole = (req, res) => {
  const id_employee = req.params.id_employee;
  const { role } = req.body;
  Employee.update({ role }, { where: { id_employee } })
    .then((num) => {
      if (num == 1) return res.send({ message: "Employee role updated successfully." });
      return res.status(404).send({ message: `Cannot update role for id_employee=${id_employee}.` });
    })
    .catch((err) => res.status(500).send({ message: "Error updating role for id_employee=" + id_employee }));
};

// Delete an Employee
exports.delete = (req, res) => {
  const id_employee = req.params.id_employee;
  Employee.destroy({ where: { id_employee } })
    .then((num) => {
      if (num == 1) return res.send({ message: "Employee was deleted successfully!" });
      return res.send({ message: `Cannot delete Employee with id_employee=${id_employee}.` });
    })
    .catch((err) => res.status(500).send({ message: "Could not delete Employee with id_employee=" + id_employee }));
};

export default exports;