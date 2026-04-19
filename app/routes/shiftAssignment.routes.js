import { Router } from "express";
import shiftAssignment from "../controllers/shiftAssignment.controller.js";
import authenticate from "../authorization/authorization.js";
import requireAnyDepartment from "../authorization/requireAnyDepartment.js";

const router = Router();

// Create a new ShiftAssignment
router.post("/", [authenticate], shiftAssignment.create);

// Retrieve all ShiftAssignments
router.get("/", [authenticate, requireAnyDepartment], shiftAssignment.findAll);

// Retrieve a single ShiftAssignment
router.get("/:id_shiftAssignment", [authenticate], shiftAssignment.findOne);

// Update a ShiftAssignment
router.put("/:id_shiftAssignment", [authenticate], shiftAssignment.update);

// Delete a ShiftAssignment
router.delete("/:id_shiftAssignment", [authenticate], shiftAssignment.delete);

export default router;
