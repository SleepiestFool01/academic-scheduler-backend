import employees from "../controllers/employee.controller.js";
import authenticate from "../authorization/authorization.js";
import requireAnyDepartment from "../authorization/requireAnyDepartment.js";
import { Router } from "express";
var router = Router()

// Create a new Employee
router.post("/", [authenticate], employees.create);

// Create a new Emloyee with
router.post("/create-employee", [authenticate], employees.createEmployee);

// Retrieve all People/Employees — returns [] for dept-less non-admins so
// users without any department memberships don't see org-wide data.
router.get("/", [authenticate, requireAnyDepartment], employees.findAll);

// Retrieve all employees
router.get("/employees", [authenticate], employees.findAllEmployees);

// Retrieve a single Employee with id_employee
router.get("/:id_employee", [authenticate], employees.findOne);

// Update a Employee with id_employee
router.put("/:id_employee", [authenticate], employees.update);

// Update Employee's Role
router.put("/role/:id_employee", [authenticate], employees.updateRole);

// Remove an employee from a single department (deletes junction row;
// reassigns primary id_department if needed). Preserves the Employee row.
router.delete(
  "/:id_employee/departments/:id_department",
  [authenticate],
  employees.removeFromDepartment
);

// Delete a Employee with id_employee
router.delete("/:id_employee", [authenticate], employees.delete);

export default router;
