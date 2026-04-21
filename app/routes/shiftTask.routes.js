import { Router } from "express";
import shiftTask from "../controllers/shiftTask.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

router.post("/",                  [authenticate], shiftTask.create);
router.get("/",                   [authenticate], shiftTask.findAll);
router.get("/:id_shiftTask",      [authenticate], shiftTask.findOne);
router.put("/:id_shiftTask",      [authenticate], shiftTask.update);
router.delete("/:id_shiftTask",   [authenticate], shiftTask.delete);

export default router;
