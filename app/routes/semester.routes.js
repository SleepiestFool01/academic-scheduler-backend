import { Router } from "express";
import semester from "../controllers/semester.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

router.get("/",        [authenticate], semester.findAll);
router.get("/active",  [authenticate], semester.findActive);
router.post("/",       [authenticate], semester.create);
router.put("/:id_semester",    [authenticate], semester.update);
router.delete("/:id_semester", [authenticate], semester.delete);

export default router;
