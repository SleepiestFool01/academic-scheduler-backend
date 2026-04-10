import db from "../models/index.js";

const EmployeeDepartment = db.employeeDepartment;
const exports = {};

// Retrieve all, with optional ?id_employee= or ?id_department= filter
exports.findAll = async (req, res) => {
    try {
        const { id_employee, id_department } = req.query;
        const where = {};
        if (id_employee)   where.id_employee   = id_employee;
        if (id_department) where.id_department = id_department;
        const data = await EmployeeDepartment.findAll({ where });
        return res.send(data);
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error retrieving EmployeeDepartments." });
    }
};

// Create a new EmployeeDepartment link
exports.create = async (req, res) => {
    try {
        const { id_employee, id_department } = req.body;
        if (!id_employee || !id_department) {
            return res.status(400).send({ message: "Missing required fields: id_employee, id_department." });
        }
        // Avoid duplicates
        const existing = await EmployeeDepartment.findOne({ where: { id_employee, id_department } });
        if (existing) return res.send(existing);

        const data = await EmployeeDepartment.create({ id_employee, id_department });
        return res.status(201).send(data);
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error creating EmployeeDepartment." });
    }
};

// Delete an EmployeeDepartment link
exports.delete = async (req, res) => {
    try {
        const num = await EmployeeDepartment.destroy({
            where: { id_employeeDepartment: req.params.id_employeeDepartment },
        });
        if (num === 1) return res.status(204).send();
        return res.status(404).send({ message: "EmployeeDepartment not found." });
    } catch (err) {
        return res.status(500).send({ message: err.message || "Error deleting EmployeeDepartment." });
    }
};

export default exports;
