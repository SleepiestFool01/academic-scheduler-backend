import { Router } from "express";
import templateShiftTask from "../controllers/templateShiftTask.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

router.post("/",                          [authenticate], templateShiftTask.create);
router.get("/",                           [authenticate], templateShiftTask.findAll);
router.get("/:id_templateShiftTask",      [authenticate], templateShiftTask.findOne);
router.delete("/:id_templateShiftTask",   [authenticate], templateShiftTask.delete);

export default router;
