import { Router } from "express";
import swapRequest from "../controllers/swapRequest.controller.js";
import authenticate from "../authorization/authorization.js";
import requireAnyDepartment from "../authorization/requireAnyDepartment.js";

const router = Router();

// Create a new SwapRequest
router.post("/", [authenticate], swapRequest.create);

// Retrieve all SwapRequests
router.get("/", [authenticate, requireAnyDepartment], swapRequest.findAll);

// Retrieve a single SwapRequest
router.get("/:id_swapRequest", [authenticate], swapRequest.findOne);

// Update a SwapRequest
router.put("/:id_swapRequest", [authenticate], swapRequest.update);

// Delete a SwapRequest
router.delete("/:id_swapRequest", [authenticate], swapRequest.delete);

export default router;
