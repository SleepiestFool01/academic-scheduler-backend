import { Router } from "express";
import positionEmployee from "../controllers/positionEmployee.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

// Get all positions assigned to a specific employee
router.get("/employee/:id_employee",  [authenticate], positionEmployee.findAllForEmployee);

// Get all employees assigned to a specific position
router.get("/position/:id_position",  [authenticate], positionEmployee.findAllForPosition);

// Assign an employee to a position
router.post("/",                      [authenticate], positionEmployee.assignPosition);

// Remove an assignment
router.delete("/:id_employee/:id_position", [authenticate], positionEmployee.removeAssignment);

export default router;
