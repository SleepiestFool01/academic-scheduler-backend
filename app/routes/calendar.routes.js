import { Router } from "express";
import calendar from "../controllers/calendar.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

// Create a calendar entry (hours of operation)
router.post("/", [authenticate], calendar.create);

// List all calendar entries
router.get("/", [authenticate], calendar.findAll);

// Get one calendar entry
router.get("/:id_hours_of_operation", [authenticate], calendar.findOne);

// Update a calendar entry
router.put("/:id_hours_of_operation", [authenticate], calendar.update);

// Delete a calendar entry
router.delete("/:id_hours_of_operation", [authenticate], calendar.delete);

export default router;
