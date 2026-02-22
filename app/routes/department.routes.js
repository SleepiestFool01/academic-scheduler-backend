import { Router } from "express";
import department from "../controllers/department.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

// Create a new Department
router.post("/", [authenticate], department.create);

// Retrieve all Departments
router.get("/", [authenticate], department.findAll);

// Retrieve a single Department
router.get("/:id_department", [authenticate], department.findOne);

// Update a Department
router.put("/:id_department", [authenticate], department.update);

// Delete a Department
router.delete("/:id_department", [authenticate], department.delete);

export default router;
