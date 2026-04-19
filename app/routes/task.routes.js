import task from "../controllers/task.controller.js";
import authenticate from "../authorization/authorization.js";
import requireAnyDepartment from "../authorization/requireAnyDepartment.js";
import { Router } from "express";

var router = Router()

// Create a new Task
router.post("/", [authenticate], task.create);

// Retrieve all Tasks
router.get("/", [authenticate, requireAnyDepartment], task.findAll);

// Retrieve all Tasks for a specific TaskList
router.get("/tasklist/:id_taskList", [authenticate], task.findAllForTaskList);

// Retrieve a single Task
router.get("/:id_task", [authenticate], task.findOne);

// Update a Task
router.put("/:id_task", [authenticate], task.update);

// Delete a Task
router.delete("/:id_task", [authenticate], task.delete);

export default router;
