import { Router } from "express";
import authenticate from "../authorization/authorization.js";
import controller from "../controllers/positionEmployee.controller.js";

const router = Router();

// Get positions assigned to a user
router.get("/user/:id_employee", [authenticate], controller.findAllForEmployee);

// Get users assigned to a lesson
router.get("/position/:id_posiion", [authenticate], controller.findAllForPosition);

// Assign a lesson to a user
router.post("/", [authenticate], controller.assignPosition);

// Remove an assignment
router.delete("/:id_employee/:id_position", [authenticate], controller.removeAssignment);

export default router;