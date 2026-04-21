import { Router } from "express";
import authenticate from "../authorization/authorization.js";
import requireAnyDepartment from "../authorization/requireAnyDepartment.js";
import timeEntry from "../controllers/timeEntry.controller.js";

const router = Router();

router.get("/my-status", [authenticate, requireAnyDepartment], timeEntry.myStatus);
router.get("/report", [authenticate, requireAnyDepartment], timeEntry.report);
router.post("/clock-in", [authenticate], timeEntry.clockIn);
router.post("/:id_timeEntry/clock-out", [authenticate], timeEntry.clockOut);

export default router;
