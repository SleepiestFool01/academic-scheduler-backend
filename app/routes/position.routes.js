// routes/positions.routes.js
import { Router } from "express";
import {
  listPositions,
  getPosition,
  createPosition,
  updatePosition,
  deletePosition,
} from "../controllers/positions.controller.js";

const router = Router();

router.get("/", listPositions);
router.get("/:id", getPosition);
router.post("/", createPosition);
router.put("/:id", updatePosition);
router.delete("/:id", deletePosition);

export default router;
