import { Router } from "express";
import controller from "../controllers/templateShiftTaskList.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

router.post("/",                               [authenticate], controller.create);
router.get("/",                                [authenticate], controller.findAll);
router.delete("/:id_templateShiftTaskList",    [authenticate], controller.delete);

export default router;
