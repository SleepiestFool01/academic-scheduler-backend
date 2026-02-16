import personalAvailability from "../controllers/personalAvailability.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

var router = Router();

// Create new PersonalAvailability for an employee
router.post(
  "/employees/:id_employee",
  [authenticate],
  personalAvailability.createForEmployee
);

// Retrieve all PersonalAvailability records for an employee
router.get(
  "/employees/:id_employee",
  [authenticate],
  personalAvailability.listForEmployee
);

// Retrieve a single PersonalAvailability record
router.get(
  "/employees/:id_employee/:id",
  [authenticate],
  personalAvailability.getOneForEmployee
);

// Update a PersonalAvailability record
router.put(
  "/employees/:id_employee/:id",
  [authenticate],
  personalAvailability.updateForEmployee
);

// Delete a PersonalAvailability record
router.delete(
  "/employees/:id_employee/:id",
  [authenticate],
  personalAvailability.deleteForEmployee
);

export default router;
