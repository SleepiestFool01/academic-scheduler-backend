import { Router } from "express";
import event from "../controllers/event.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

// Create a new Event
router.post("/", [authenticate], event.create);

// Retrieve all Events (optional ?id_department=)
router.get("/", [authenticate], event.findAll);

// Retrieve a single Event
router.get("/:id_event", [authenticate], event.findOne);

// Update an Event
router.put("/:id_event", [authenticate], event.update);

// Delete an Event
router.delete("/:id_event", [authenticate], event.delete);

export default router;
