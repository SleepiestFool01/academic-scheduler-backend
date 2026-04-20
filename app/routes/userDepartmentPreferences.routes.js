import { Router } from "express";
import userDepartmentPreferences from "../controllers/userDepartmentPreferences.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], userDepartmentPreferences.findMine);
router.put("/", [authenticate], userDepartmentPreferences.saveMine);

export default router;
