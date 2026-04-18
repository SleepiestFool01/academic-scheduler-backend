import { Router } from "express";
import employeeUnavailability from "../controllers/employeeUnavailability.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

router.get("/",    [authenticate], employeeUnavailability.findAll);
router.post("/",   [authenticate], employeeUnavailability.create);
router.post("/import",      [authenticate], employeeUnavailability.importForEmployee);
router.post("/import-bulk", [authenticate], employeeUnavailability.importForDepartment);
router.put("/:id_employeeUnavailability",    [authenticate], employeeUnavailability.update);
router.delete("/:id_employeeUnavailability", [authenticate], employeeUnavailability.delete);

export default router;
