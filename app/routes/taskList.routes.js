import { Router } from "express";
import taskList from "../controllers/taskList.controller.js";
import authenticate from "../authorization/authorization.js";
import requireAnyDepartment from "../authorization/requireAnyDepartment.js";

const router = Router();

// Create a new TaskList
router.post("/", [authenticate], taskList.create);

// Retrieve all TaskLists
router.get("/", [authenticate, requireAnyDepartment], taskList.findAll);

// Retrieve a single TaskList
router.get("/:id_taskList", [authenticate], taskList.findOne);

// Update a TaskList
router.put("/:id_taskList", [authenticate], taskList.update);

// Delete a TaskList
router.delete("/:id_taskList", [authenticate], taskList.delete);

export default router;
