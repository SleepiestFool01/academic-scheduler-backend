import { Router } from "express";
import employeeDepartment from "../controllers/employeeDepartment.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

router.get("/",                            [authenticate], employeeDepartment.findAll);
router.post("/",                           [authenticate], employeeDepartment.create);
router.delete("/:id_employeeDepartment",   [authenticate], employeeDepartment.delete);

export default router;
