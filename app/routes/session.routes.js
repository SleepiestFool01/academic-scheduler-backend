import { Router } from "express";
import authenticate from "../authorization/authorization.js";
import sessionController from "../controllers/session.controller.js";

const router = Router();

// Create a new session
router.post("/", [authenticate], sessionController.create);

// Retrieve all sessions
router.get("/", [authenticate], sessionController.findAll);

// Retrieve sessions for a specific employee
router.get("/employee/:id_employee", [authenticate], sessionController.findAllForEmployee);

// Retrieve a single session
router.get("/:id_session", [authenticate], sessionController.findOne);

// Update a session
router.put("/:id_session", [authenticate], sessionController.update);

// Delete a session
router.delete("/:id_session", [authenticate], sessionController.delete);

export default router;
