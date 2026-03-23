import { Router } from "express";
import templateShift from "../controllers/templateShift.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

router.post("/",                    [authenticate], templateShift.create);
router.get("/",                     [authenticate], templateShift.findAll);
router.get("/:id_templateShift",    [authenticate], templateShift.findOne);
router.put("/:id_templateShift",    [authenticate], templateShift.update);
router.delete("/:id_templateShift", [authenticate], templateShift.delete);

export default router;
