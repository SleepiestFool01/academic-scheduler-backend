import { Router } from "express";
import positionTaskList from "../controllers/positionTaskList.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

router.post("/",                           [authenticate], positionTaskList.create);
router.get("/",                            [authenticate], positionTaskList.findAll);
router.get("/:id_positionTaskList",        [authenticate], positionTaskList.findOne);
router.delete("/:id_positionTaskList",     [authenticate], positionTaskList.delete);

export default router;
