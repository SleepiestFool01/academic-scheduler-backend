import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import EmployeeRoutes from "./employee.routes.js";
import SessionRoutes from "./session.routes.js";
import PositionRoutes from "./position.routes.js";
import DepartmentRoutes from "./department.routes.js";
import CalendarRoutes from "./calendar.routes.js";
import PersonalAvailabilityRoutes from "./personalAvailability.routes.js";
import ShiftRoutes from "./shift.routes.js";
import ShiftAssignmentRoutes from "./shiftAssignment.routes.js";
import ShiftTaskListRoutes from "./shiftTaskList.routes.js";
import ShiftTaskListStatusRoutes from "./shiftTaskListStatus.routes.js";
import TaskRoutes from "./task.routes.js";
import TaskListRoutes from "./taskList.routes.js";
import SettingRoutes from "./setting.routes.js";
import SettingValueRoutes from "./settingValue.routes.js";
import SwapRequestRoutes from "./swapRequest.routes.js";
import EventRoutes from "./event.routes.js";

const router = Router();

router.use("/", AuthRoutes);
router.use("/employees", EmployeeRoutes);
router.use("/sessions", SessionRoutes);
router.use("/position", PositionRoutes);
router.use("/departments", DepartmentRoutes);
router.use("/calendar", CalendarRoutes);
router.use("/personal-availability", PersonalAvailabilityRoutes);
router.use("/shifts", ShiftRoutes);
router.use("/shift-assignments", ShiftAssignmentRoutes);
router.use("/shift-task-lists", ShiftTaskListRoutes);
router.use("/shift-task-list-status", ShiftTaskListStatusRoutes);
router.use("/tasks", TaskRoutes);
router.use("/task-lists", TaskListRoutes);
router.use("/settings", SettingRoutes);
router.use("/setting-values", SettingValueRoutes);
router.use("/swap-requests", SwapRequestRoutes);
router.use("/events", EventRoutes);

export default router;
