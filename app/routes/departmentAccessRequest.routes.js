import { Router } from "express";
import departmentAccessRequest from "../controllers/departmentAccessRequest.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

router.post("/",                                  [authenticate], departmentAccessRequest.create);
router.get("/",                                   [authenticate], departmentAccessRequest.findAll);
router.get("/:id_departmentAccessRequest",        [authenticate], departmentAccessRequest.findOne);
router.put("/:id_departmentAccessRequest",        [authenticate], departmentAccessRequest.update);
router.delete("/:id_departmentAccessRequest",     [authenticate], departmentAccessRequest.delete);

export default router;
