import db from "../models/index.js";
import { sendEmail } from "../utils/mailer.js";
import {
  deptAccessRequestedEmail,
  deptAccessApprovedEmail,
  deptAccessDeniedEmail,
} from "../utils/emailTemplates.js";
import { shouldNotify } from "../utils/preferences.js";

const DepartmentAccessRequest = db.departmentAccessRequest;
const ManagerDepartment        = db.managerDepartment;
const EmployeeDepartment       = db.employeeDepartment;
const Employee                 = db.employee;
const Department               = db.department;
const exports = {};

// Create a new request
exports.create = async (req, res) => {
    try {
        const { id_employeeRequester, id_department, message } = req.body;
        if (!id_employeeRequester || !id_department) {
            return res.status(400).send({ message: "Missing required fields: id_employeeRequester, id_department." });
        }

        // Product rule: an unaffiliated employee (not yet added to any
        // department by a manager) must wait to be added to their first
        // department before they can request access to others. This
        // prevents brand-new sign-ins from spamming request-access.
        const requester = await Employee.findByPk(id_employeeRequester);
        if (!requester) return res.status(404).send({ message: "Requester not found." });
        const isAdminOrManager = requester.role === "Admin" || requester.role === "Manager";
        if (!isAdminOrManager && requester.id_department == null) {
            const [mgr, emp] = await Promise.all([
                ManagerDepartment.findOne({ where: { id_employee: id_employeeRequester } }),
                EmployeeDepartment.findOne({ where: { id_employee: id_employeeRequester } }),
            ]);
            if (!mgr && !emp) {
                return res.status(403).send({
                    message: "You must be added to a department by a manager before you can request access to others.",
                });
            }
        }

        const data = await DepartmentAccessRequest.create({
            id_employeeRequester,
            id_department,
            message: message || null,
        });
        res.status(201).send(data);

        // Notify admins + managers of the target department (non-blocking)
        try {
            const [requester, dept] = await Promise.all([
                Employee.findByPk(id_employeeRequester),
                Department.findByPk(id_department),
            ]);
            const requesterName = requester ? `${requester.fName} ${requester.lName}` : "Unknown";
            const deptName = dept ? dept.name : "Unknown";

            // Find managers of this department
            const mgrDepts = await ManagerDepartment.findAll({ where: { id_department } });
            const mgrIds = mgrDepts.map((md) => md.id_employee);

            // Also find all Admins
            const admins = await Employee.findAll({ where: { role: "Admin" } });
            const adminIds = admins.map((a) => a.id_employee);

            // Combine unique IDs
            const recipientIds = [...new Set([...mgrIds, ...adminIds])];
            if (recipientIds.length) {
                const recipients = await Employee.findAll({ where: { id_employee: recipientIds } });
                const mgrIdSet = new Set(mgrIds);
                for (const r of recipients) {
                    // Managers of the target dept check newAccessRequest scoped
                    // to that dept. Admins (who might not manage the dept)
                    // check crossDeptAccess on the target dept as the closest
                    // meaningful scope.
                    const key = mgrIdSet.has(r.id_employee) ? "newAccessRequest" : "crossDeptAccess";
                    const notify = await shouldNotify(r.id_employee, id_department, key);
                    if (!notify) continue;
                    sendEmail(
                        r.email,
                        "New department access request",
                        deptAccessRequestedEmail(`${r.fName} ${r.lName}`, requesterName, deptName)
                    ).catch(console.error);
                }
            }
        } catch (emailErr) {
            console.error("[deptAccessRequest.create] Email notification error:", emailErr.message);
        }
        return;
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

                // Match the "Add Employee" path: if the requester has no
                // primary id_department yet, adopt the one they were just
                // approved for so both add-flows (manager-initiated and
                // employee-initiated) produce identical DB state. Never
                // clobber a non-null primary — that belongs to whichever
                // dept hired them first.
                if (requester && requester.id_department == null) {
                    await Employee.update(
                        { id_department: request.id_department },
                        { where: { id_employee: request.id_employeeRequester } }
                    );
                }
            }
        }

        const [num] = await DepartmentAccessRequest.update(req.body, {
            where: { id_departmentAccessRequest: id },
        });
        if (num !== 1) {
            return res.status(404).send({ message: "DepartmentAccessRequest not found or body empty." });
        }

        // Send approved/denied email to the requester (non-blocking)
        if (req.body.status === "Approved" || req.body.status === "Denied") {
            try {
                const reqRecord = await DepartmentAccessRequest.findByPk(id);
                if (reqRecord) {
                    const [requester, dept] = await Promise.all([
                        Employee.findByPk(reqRecord.id_employeeRequester),
                        Department.findByPk(reqRecord.id_department),
                    ]);
                    if (requester && dept) {
                        const name = `${requester.fName} ${requester.lName}`;
                        const template = req.body.status === "Approved"
                            ? deptAccessApprovedEmail(name, dept.name)
                            : deptAccessDeniedEmail(name, dept.name);
                        sendEmail(
                            requester.email,
                            `Department access ${req.body.status.toLowerCase()}`,
                            template
                        ).catch(console.error);
                    }
                }
            } catch (emailErr) {
                console.error("[deptAccessRequest.update] Email notification error:", emailErr.message);
            }
        }

        return res.send({ message: "DepartmentAccessRequest updated successfully." });
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
