import { Router } from "express";
import settingValue from "../controllers/settingValue.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

// Create a new SettingValue
router.post("/", [authenticate], settingValue.create);

// Retrieve all SettingValues
router.get("/", [authenticate], settingValue.findAll);

// Retrieve a single SettingValue
router.get("/:id_settingValue", [authenticate], settingValue.findOne);

// Update a SettingValue
router.put("/:id_settingValue", [authenticate], settingValue.update);

// Delete a SettingValue
router.delete("/:id_settingValue", [authenticate], settingValue.delete);

export default router;
