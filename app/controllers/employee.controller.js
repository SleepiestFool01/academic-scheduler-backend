import db from "../models/index.js";

const Employee = db.user;
const Op = db.Sequelize.Op;
const exports = {};

// Create and Save a new Employee
exports.create = (req, res) => {
  // Validate request
  if (!req.body.fName) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }

  // Create a Employee
  const employee = {
    fName: req.body.fName,
    lName: req.body.lName,
    email: req.body.email,
    bio: req.body.bio ?? undefined,
    // refresh_token: req.body.refresh_token,
    // expiration_date: req.body.expiration_date
  };

  // Save Employee in the database
  Employee.create(employee)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Employee.",
      });
    });
};

// Retrieve all People from the database.
exports.findAll = (req, res) => {
  const id_employee = req.query.id_employee;
  const condition = id_employee
    ? { id_employee: { [Op.like]: `%${id_employee}%` } }
    : null;

  Employee.findAll({ where: condition })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving people.",
      });
    });
};

// Find all users with role = "Employee"
exports.findAllEmployees = (req, res) => {
  db.user
    .findAll({ where: { role: "Employee" } })
    .then(data => res.send(data))
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving employees.",
      });
    });
};

exports.createEmployee = (req, res) => {
  const employee = {
    fName: req.body.fName,
    lName: req.body.lName,
    email: req.body.email,
    role: "Employee",
    bio: req.body.bio ?? undefined,
  };

  Employee.create(employee)
    .then(data => res.send(data))
    .catch(err => {
      res.status(500).send({
        message: err.message || "Error creating employee."
      });
    });
};

// Find a single Employee with an id
exports.findOne = (req, res) => {
  const id_employee = req.params.id_employee;

  Employee.findByPk(id_employee)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Employee with id_employee=${id_employee}.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving Employee with id_employee=" + id_employee,
      });
    });
};

// Find a single Employee with an email
exports.findByEmail = (req, res) => {
  const email = req.params.email;

  Employee.findOne({
    where: {
      email: email,
    },
  })
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.send({ email: "not found" });
        /*res.status(404).send({
          message: `Cannot find Employee with email=${email}.`
        });*/
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving Employee with email=" + email,
      });
    });
};

// Update a Employee by the id in the request
exports.update = (req, res) => {
  const id_employee = req.params.id_employee;

  Employee.update(req.body, {
    where: { id_employee },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Employee was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update Employee with id_employee=${id_employee}. Maybe Employee was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Employee with id_employee=" + id_employee,
      });
    });
};

console.log("update reached");

exports.updateRole = (req, res) => {
  const id_employee = req.params.id_employee;
  const {role} = req.body;

  Employee.update({ role }, {
    where: { id_employee },
  })
  .then((num) => {
      if (num == 1) {
        res.send({
          message: "Employee was updated successfully.",
        });
      } else {
        res.stats(404).send({
          message: `Cannot update Employee Role with id_employee=${id_employee}. Employee was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Employee's role with id_employee=" + id_employee,
      });
    });

};

// Delete a Employee with the specified id in the request
exports.delete = (req, res) => {
  const id_employee = req.params.id_employee;

  Employee.destroy({
    where: { id_employee },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Employee was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete Employee with id_employee=${id_employee}. Maybe Employee was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete Employee with id_employee=" + id_employee,
      });
    });
};


export default exports;
