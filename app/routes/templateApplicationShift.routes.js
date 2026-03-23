import { Router } from "express";
import controller from "../controllers/templateApplication.controller.js";
import authenticate from "../authorization/authorization.js";

const router = Router();

router.post("/",    [authenticate], controller.createShiftLink);
router.get("/",     [authenticate], controller.findShiftLinks);

export default router;
