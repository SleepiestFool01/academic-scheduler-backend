// routes/position.routes.js
import { Router } from "express";
import position from "../controllers/position.controller.js";

const router = Router();

// GET /position?id_department=...
router.get("/", position.findAll);

// GET /position/:id_position
router.get("/:id_position", position.findOne);

// POST /position
router.post("/", position.create);

// PUT /position/:id_position
router.put("/:id_position", position.update);

// DELETE /position/:id_position
router.delete("/:id_position", position.delete);

// (optional) GET /position/department/:id_department
router.get("/department/:id_department", position.findAllForDepartment);

export default router;
