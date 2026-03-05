import { Router } from "express";
import managerDepartment from "../controllers/managerDepartment.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

router.get("/",                           [authenticate], managerDepartment.findAll);
router.post("/",                          [authenticate], managerDepartment.create);
router.delete("/:id_managerDepartment",   [authenticate], managerDepartment.delete);

export default router;
