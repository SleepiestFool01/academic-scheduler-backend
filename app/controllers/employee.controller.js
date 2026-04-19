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

// Retrieve all employees (any role).
// When filtering by id_department, also include employees who joined that
// department via the employeeDepartment junction (cross-department staff).
exports.findAll = async (req, res) => {
  try {
    const { id_employee, id_department } = req.query;

    if (id_department) {
      // Pull every junction row for this department to find cross-dept members.
      const junctionRows = await db.employeeDepartment.findAll({
        where: { id_department },
      });
      const junctionEmpIds = junctionRows.map(r => r.id_employee);

      const where = {
        [Op.or]: [
          { id_department },
          ...(junctionEmpIds.length ? [{ id_employee: { [Op.in]: junctionEmpIds } }] : []),
        ],
      };
      if (id_employee) where.id_employee = { [Op.like]: `%${id_employee}%` };

      const data = await Employee.findAll({ where });
      return res.send(data);
    }

    // No department filter — fall back to the original behavior.
    const condition = {};
    if (id_employee) condition.id_employee = { [Op.like]: `%${id_employee}%` };
    const data = await Employee.findAll({ where: Object.keys(condition).length ? condition : undefined });
    return res.send(data);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error retrieving employees." });
  }
};

// Find all employees with role = "Employee"
exports.findAllEmployees = (req, res) => {
  Employee.findAll({ where: { role: "Employee" } })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message || "Error retrieving employees." }));
};

// Create a new employee — or, when an employee with the given email already
// exists, simply grant them access to the requested department by writing
// the appropriate junction row (managerDepartment for Manager/Admin roles,
// employeeDepartment for regular Employees). This lets a manager of Dept B
// "Add Employee" using the email of someone who already works in Dept A
// without duplicating their record or wiping out their primary department.
exports.createEmployee = async (req, res) => {
  try {
    const role          = req.body.role || "Employee";
    const id_department = req.body.id_department ?? null;
    const email         = req.body.email;

    // 1. If that email is already on file, attach the existing employee to
    //    the requested department instead of creating a duplicate.
    if (email) {
      const existing = await Employee.findOne({ where: { email } });
      if (existing) {
        if (id_department) {
          const isManagerRole = existing.role === "Manager" || existing.role === "Admin";
          const Junction = isManagerRole ? db.managerDepartment : db.employeeDepartment;
          const dup = await Junction.findOne({
            where: { id_employee: existing.id_employee, id_department },
          });
          if (!dup) {
            await Junction.create({ id_employee: existing.id_employee, id_department });
          }
          // If the existing row has no primary dept yet (common when the
          // employee Google-signed-in before any manager added them),
          // adopt the one we're attaching them to so id_department and the
          // junction table stay in sync. Never clobber a non-null primary
          // — that belongs to whichever dept hired them first.
          if (existing.id_department == null) {
            await Employee.update(
              { id_department },
              { where: { id_employee: existing.id_employee } }
            );
            existing.id_department = id_department;
          }
        }
        return res.send(existing);
      }
    }

    // 2. Brand-new employee — create the row as before.
    const data = await Employee.create({
      fName:         req.body.fName,
      lName:         req.body.lName,
      email,
      role,
      bio:           req.body.bio ?? undefined,
      id_department: id_department ?? undefined,
    });

    // Mirror the primary department in the junction table so membership is
    // canonical regardless of which field callers read from. Managers go to
    // managerDepartment; everyone else to employeeDepartment.
    if (id_department) {
      const isManagerRole = role === "Manager" || role === "Admin";
      const Junction = isManagerRole ? db.managerDepartment : db.employeeDepartment;
      try {
        await Junction.create({ id_employee: data.id_employee, id_department });
      } catch (_) { /* ignore duplicate-key and other non-critical errors */ }
    }

    return res.send(data);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error creating employee." });
  }
};

// Remove an employee from a specific department. Deletes the junction row
// (managerDepartment or employeeDepartment depending on role) and, if the
// dept was the employee's primary id_department, reassigns the primary to
// another junction dept (or null). The employee record itself is preserved.
exports.removeFromDepartment = async (req, res) => {
  try {
    const id_employee   = Number(req.params.id_employee);
    const id_department = Number(req.params.id_department);
    if (!id_employee || !id_department) {
      return res.status(400).send({ message: "id_employee and id_department are required." });
    }

    const employee = await Employee.findByPk(id_employee);
    if (!employee) return res.status(404).send({ message: "Employee not found." });

    const isManagerRole = employee.role === "Manager" || employee.role === "Admin";
    const Junction      = isManagerRole ? db.managerDepartment : db.employeeDepartment;

    // Delete the junction row for this (employee, dept) if it exists.
    await Junction.destroy({ where: { id_employee, id_department } });

    // If the removed dept was the employee's primary, pick a replacement
    // from any remaining junction rows so id_department stays in sync.
    if (Number(employee.id_department) === id_department) {
      const remaining = await Junction.findAll({ where: { id_employee } });
      const nextPrimary = remaining.length ? remaining[0].id_department : null;
      await Employee.update({ id_department: nextPrimary }, { where: { id_employee } });
    }

    return res.send({ message: "Employee removed from department." });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Error removing employee from department." });
  }
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
exports.delete = async (req, res) => {
  const id_employee = req.params.id_employee;
  try {
    // Clean up sessions tied to this employee so stale tokens can't survive
    // and cause 401s after a replacement employee is created with the same
    // email.
    await db.session.destroy({ where: { id_user: id_employee } });
    const num = await Employee.destroy({ where: { id_employee } });
    if (num == 1) return res.send({ message: "Employee was deleted successfully!" });
    return res.send({ message: `Cannot delete Employee with id_employee=${id_employee}.` });
  } catch (err) {
    return res.status(500).send({ message: "Could not delete Employee with id_employee=" + id_employee });
  }
};

export default exports;