import { Router } from "express";
import shift from "../controllers/shift.controller.js";
import authenticate from "../authorization/authorization.js";
import requireAnyDepartment from "../authorization/requireAnyDepartment.js";

const router = Router();

// Create a new Shifts
router.post("/", [authenticate], shift.create);

// Retrieve all Shifts
router.get("/", [authenticate, requireAnyDepartment], shift.findAll);

// Retrieve a single Shift
router.get("/:id_shift", [authenticate], shift.findOne);

// Update a Shift
router.put("/:id_shift", [authenticate], shift.update);

// Delete a Shift
router.delete("/:id_shift", [authenticate], shift.delete);

export default router;
