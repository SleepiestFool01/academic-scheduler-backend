import db from "../models/index.js";

const DepartmentAccessRequest = db.departmentAccessRequest;
const ManagerDepartment        = db.managerDepartment;
const Employee                 = db.employee;
const exports = {};

// Create a new request
exports.create = async (req, res) => {
    try {
        const { id_employeeRequester, id_department, message } = req.body;
        if (!id_employeeRequester || !id_department) {
            return res.status(400).send({ message: "Missing required fields: id_employeeRequester, id_department." });
        }
        const data = await DepartmentAccessRequest.create({
            id_employeeRequester,
            id_department,
            message: message || null,
        });
        return res.status(201).send(data);
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error creating DepartmentAccessRequest." });
    }
};

// Retrieve all, with optional ?status= or ?id_employeeRequester= filter
exports.findAll = async (req, res) => {
    try {
        const { status, id_employeeRequester } = req.query;
        const where = {};
        if (status)               where.status               = status;
        if (id_employeeRequester) where.id_employeeRequester = id_employeeRequester;
        const data = await DepartmentAccessRequest.findAll({ where });
        return res.send(data);
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error retrieving DepartmentAccessRequests." });
    }
};

// Retrieve a single request
exports.findOne = async (req, res) => {
    try {
        const data = await DepartmentAccessRequest.findByPk(req.params.id_departmentAccessRequest);
        if (data) return res.send(data);
        return res.status(404).send({ message: "DepartmentAccessRequest not found." });
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error retrieving DepartmentAccessRequest." });
    }
};

// Update a request — when Approved, also create a ManagerDepartment record
exports.update = async (req, res) => {
    try {
        const id = req.params.id_departmentAccessRequest;

        if (req.body.status === "Approved") {
            const request = await DepartmentAccessRequest.findByPk(id);
            if (request) {
                // Grant access via junction table
                const existing = await ManagerDepartment.findOne({
                    where: { id_employee: request.id_employeeRequester, id_department: request.id_department },
                });
                if (!existing) {
                    await ManagerDepartment.create({
                        id_employee:   request.id_employeeRequester,
                        id_department: request.id_department,
                    });
                }
            }
        }

        const [num] = await DepartmentAccessRequest.update(req.body, {
            where: { id_departmentAccessRequest: id },
        });
        if (num === 1) return res.send({ message: "DepartmentAccessRequest updated successfully." });
        return res.status(404).send({ message: "DepartmentAccessRequest not found or body empty." });
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error updating DepartmentAccessRequest." });
    }
};

// Delete a request
exports.delete = async (req, res) => {
    try {
        const num = await DepartmentAccessRequest.destroy({
            where: { id_departmentAccessRequest: req.params.id_departmentAccessRequest },
        });
        if (num === 1) return res.status(204).send();
        return res.status(404).send({ message: "DepartmentAccessRequest not found." });
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error deleting DepartmentAccessRequest." });
    }
};

export default exports;
