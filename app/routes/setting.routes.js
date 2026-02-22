import { Router } from "express";
import setting from "../controllers/setting.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

// Create a new Setting
router.post("/", [authenticate], setting.create);

// Retrieve all Settings
router.get("/", [authenticate], setting.findAll);

// Retrieve a single Setting
router.get("/:id_setting", [authenticate], setting.findOne);

// Update a Setting
router.put("/:id_setting", [authenticate], setting.update);

// Delete a Setting
router.delete("/:id_setting", [authenticate], setting.delete);

export default router;
