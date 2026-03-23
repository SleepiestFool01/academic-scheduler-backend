import { Router } from "express";
import controller from "../controllers/templateApplication.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

// Template Applications
router.post("/",    [authenticate], controller.create);
router.get("/",     [authenticate], controller.findAll);

export default router;
