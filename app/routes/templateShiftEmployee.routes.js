import { Router } from "express";
import controller from "../controllers/templateShiftEmployee.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

router.post("/",                               [authenticate], controller.create);
router.get("/",                                [authenticate], controller.findAll);
router.delete("/:id_templateShiftEmployee",    [authenticate], controller.delete);

export default router;
