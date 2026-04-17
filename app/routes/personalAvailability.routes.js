import personalAvailability from "../controllers/personalAvailability.controller.js";
import authenticate from "../authorization/authorization.js";
import requireAnyDepartment from "../authorization/requireAnyDepartment.js";
import { Router } from "express";

var router = Router();

// Retrieve all PersonalAvailability records (used by the Requests page)
router.get(
  "/",
  [authenticate, requireAnyDepartment],
  personalAvailability.findAll
);

// Delete a PersonalAvailability record by id (no employee in path)
router.delete(
  "/:id_personalAvailability",
  [authenticate],
  personalAvailability.delete
);

// Create new PersonalAvailability for an employee
router.post(
  "/employees/:id_employee",
  [authenticate],
  personalAvailability.create
);

// Retrieve all PersonalAvailability records for an employee
router.get(
  "/employees/:id_employee",
  [authenticate],
  personalAvailability.findAllForEmployee
);

// Retrieve a single PersonalAvailability record
router.get(
  "/employees/:id_employee/:id_personalAvailability",
  [authenticate],
  personalAvailability.findOne
);

// Update a PersonalAvailability record
router.put(
  "/employees/:id_employee/:id_personalAvailability",
  [authenticate],
  personalAvailability.update
);

// Delete a PersonalAvailability record
router.delete(
  "/employees/:id_employee/:id_personalAvailability",
  [authenticate],
  personalAvailability.delete
);

export default router;
