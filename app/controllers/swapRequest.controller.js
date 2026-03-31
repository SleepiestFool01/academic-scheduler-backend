import db from "../models/index.js";

const SwapRequest = db.swapRequest;
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
exports.update = (req, res) => {
  SwapRequest.update(req.body, {
    where: { id_swapRequest: req.params.id_swapRequest },
  })
    .then((num) => {
      if (num === 1 || (Array.isArray(num) && num[0] === 1)) {
        return res.send({ message: "SwapRequest updated successfully." });
      }
      return res
        .status(404)
        .send({ message: "SwapRequest not found or body empty." });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error updating SwapRequest.",
      })
    );
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
