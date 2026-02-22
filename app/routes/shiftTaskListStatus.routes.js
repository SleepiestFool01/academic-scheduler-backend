import { Router } from "express";
import shiftTaskListStatus from "../controllers/shiftTaskListStatus.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

// Create a new ShiftTaskListStatus
router.post("/", [authenticate], shiftTaskListStatus.create);

// Retrieve all ShiftTaskListStatuses
router.get("/", [authenticate], shiftTaskListStatus.findAll);

// Retrieve a single ShiftTaskListStatus
router.get("/:id_shiftTaskListStatus", [authenticate], shiftTaskListStatus.findOne);

// Update a ShiftTaskListStatus
router.put("/:id_shiftTaskListStatus", [authenticate], shiftTaskListStatus.update);

// Delete a ShiftTaskListStatus
router.delete("/:id_shiftTaskListStatus", [authenticate], shiftTaskListStatus.delete);

export default router;
