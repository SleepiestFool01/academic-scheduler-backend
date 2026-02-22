import { Router } from "express";
import shiftTaskList from "../controllers/shiftTaskList.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

// Create a new ShiftTaskList entry
router.post("/", [authenticate], shiftTaskList.create);

// Retrieve all ShiftTaskList entries
router.get("/", [authenticate], shiftTaskList.findAll);

// Retrieve a single ShiftTaskList entry
router.get("/:id_shiftTaskList", [authenticate], shiftTaskList.findOne);

// Update a ShiftTaskList entry
router.put("/:id_shiftTaskList", [authenticate], shiftTaskList.update);

// Delete a ShiftTaskList entry
router.delete("/:id_shiftTaskList", [authenticate], shiftTaskList.delete);

export default router;
