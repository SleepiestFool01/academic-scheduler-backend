import { Router } from "express";
import shift from "../controllers/shift.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

// Create a new Shift
router.post("/", [authenticate], shift.create);

// Retrieve all Shifts
router.get("/", [authenticate], shift.findAll);

// Retrieve a single Shift
router.get("/:id_shift", [authenticate], shift.findOne);

// Update a Shift
router.put("/:id_shift", [authenticate], shift.update);

// Delete a Shift
router.delete("/:id_shift", [authenticate], shift.delete);

export default router;
