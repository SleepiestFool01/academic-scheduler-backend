import db from "../models/index.js";

const DepartmentAccessRequest = db.departmentAccessRequest;
const ManagerDepartment        = db.managerDepartment;
const EmployeeDepartment       = db.employeeDepartment;
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

// Update a request — when Approved, also create the appropriate junction
// row. Authorization rules:
//   • Admins may approve or deny anything.
//   • Managers may approve or deny *Employee* requests targeting departments
//     they currently manage. They may not approve manager-to-manager
//     requests — those still require an Admin.
exports.update = async (req, res) => {
    try {
        const id = req.params.id_departmentAccessRequest;

        if (req.body.status === "Approved" || req.body.status === "Denied") {
            if (!req.user) {
                return res.status(401).send({ message: "Unauthorized." });
            }

            if (req.user.role !== "Admin") {
                // Only Admins are unconditionally allowed. Managers may
                // approve only employee requests for their own departments.
                if (req.user.role !== "Manager") {
                    return res.status(403).send({
                        message: "You are not permitted to approve or deny department access requests.",
                    });
                }

                const request = await DepartmentAccessRequest.findByPk(id);
                if (!request) return res.status(404).send({ message: "DepartmentAccessRequest not found." });

                const requester = await Employee.findByPk(request.id_employeeRequester);
                const requesterIsEmployee =
                    requester && requester.role !== "Manager" && requester.role !== "Admin";
                if (!requesterIsEmployee) {
                    return res.status(403).send({
                        message: "Only Admins may approve or deny manager-level department access requests.",
                    });
                }

                const managesDept = await ManagerDepartment.findOne({
                    where: { id_employee: req.user.id_employee, id_department: request.id_department },
                });
                if (!managesDept) {
                    return res.status(403).send({
                        message: "You may only approve requests for departments you manage.",
                    });
                }
            }
        }

        if (req.body.status === "Approved") {
            const request = await DepartmentAccessRequest.findByPk(id);
            if (request) {
                // Look up the requester to decide which junction table to
                // write into. Managers/Admins go in managerDepartment;
                // regular Employees go in employeeDepartment so the access
                // is tracked separately and they don't gain manager rights.
                const requester = await Employee.findByPk(request.id_employeeRequester);
                const isManagerRequester =
                    requester && (requester.role === "Manager" || requester.role === "Admin");

                if (isManagerRequester) {
                    const existing = await ManagerDepartment.findOne({
                        where: { id_employee: request.id_employeeRequester, id_department: request.id_department },
                    });
                    if (!existing) {
                        await ManagerDepartment.create({
                            id_employee:   request.id_employeeRequester,
                            id_department: request.id_department,
                        });
                    }
                } else {
                    const existing = await EmployeeDepartment.findOne({
                        where: { id_employee: request.id_employeeRequester, id_department: request.id_department },
                    });
                    if (!existing) {
                        await EmployeeDepartment.create({
                            id_employee:   request.id_employeeRequester,
                            id_department: request.id_department,
                        });
                    }
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
