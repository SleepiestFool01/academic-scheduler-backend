import { Router } from "express";
import template from "../controllers/template.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

router.post("/",             [authenticate], template.create);
router.get("/",              [authenticate], template.findAll);
router.get("/:id_template",  [authenticate], template.findOne);
router.put("/:id_template",  [authenticate], template.update);
router.delete("/:id_template",[authenticate], template.delete);

export default router;
