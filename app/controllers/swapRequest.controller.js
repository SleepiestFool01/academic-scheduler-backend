import db from "../models/index.js";

const SwapRequest = db.swapRequest;
const ShiftAssignment = db.shiftAssignment;
const exports = {};

// Create and save a new SwapRequest
exports.create = (req, res) => {
  const { id_shift, id_employeeRequester, id_employeeRequested, status } = req.body;

  if (!id_shift || !id_employeeRequester) {
    return res.status(400).send({
      message: "Missing required fields: id_shift, id_employeeRequester.",
    });
  }

  SwapRequest.create({
    id_shift,
    id_employeeRequester,
    id_employeeRequested,
    status, // optional; defaults to model default if not provided
  })
    .then((data) => res.status(201).send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error creating SwapRequest.",
      })
    );
};

// Retrieve all SwapRequests
exports.findAll = (_req, res) => {
  SwapRequest.findAll()
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving SwapRequests.",
      })
    );
};

// Retrieve a single SwapRequest by PK
exports.findOne = (req, res) => {
  SwapRequest.findByPk(req.params.id_swapRequest)
    .then((data) => {
      if (data) return res.send(data);
      return res.status(404).send({ message: "SwapRequest not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving SwapRequest.",
      })
    );
};

// Update a SwapRequest by PK
exports.update = async (req, res) => {
  try {
    const id_swapRequest = req.params.id_swapRequest;
    const swap = await SwapRequest.findByPk(id_swapRequest);
    if (!swap) {
      return res.status(404).send({ message: "SwapRequest not found." });
    }

    await swap.update(req.body);

    // When a manager approves the swap, actually reassign the shift from
    // the requester to the requested employee.
    if (req.body.status === "Approved") {
      const targetEmployee = swap.id_employeeRequested;
      if (!targetEmployee) {
        return res.status(400).send({
          message: "Cannot approve swap: no employee has claimed this shift.",
        });
      }

      const assignment = await ShiftAssignment.findOne({
        where: {
          id_shift: swap.id_shift,
          id_employee: swap.id_employeeRequester,
        },
      });

      if (!assignment) {
        return res.status(404).send({
          message: "Shift assignment for requester not found.",
        });
      }

      assignment.id_employee = targetEmployee;
      await assignment.save();
    }

    return res.send({ message: "SwapRequest updated successfully." });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error updating SwapRequest.",
    });
  }
};

// Delete a SwapRequest by PK
exports.delete = (req, res) => {
  SwapRequest.destroy({
    where: { id_swapRequest: req.params.id_swapRequest },
  })
    .then((num) => {
      if (num === 1) return res.status(204).send();
      return res.status(404).send({ message: "SwapRequest not found." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error deleting SwapRequest.",
      })
    );
};

export default exports;
