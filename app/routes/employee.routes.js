import employees from "../controllers/employee.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
var router = Router()

// Create a new Employee
router.post("/", [authenticate], employees.create);

// Create a new Emloyee with 
router.post("/create-employee", [authenticate], employees.createEmployee);

// Retrieve all People/Employees
router.get("/", [authenticate], employees.findAll);

// Retrieve all employees
router.get("/employees", [authenticate], employees.findAllEmployees);

// Retrieve a single Employee with id_employee
router.get("/:id_employee", [authenticate], employees.findOne);

// Update Employee's Role (must be before /:id_employee to avoid route shadowing)
router.put("/role/:id_employee", [authenticate], employees.updateRole);

// Update a Employee with id_employee
router.put("/:id_employee", [authenticate], employees.update);

// Delete a Employee with id_employee
router.delete("/:id_employee", [authenticate], employees.delete);

export default router;
