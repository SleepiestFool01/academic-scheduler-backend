import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

// Junction table allowing a single Employee to belong to multiple Departments.
// Mirrors managerDepartment but is used for non-manager staff who work
// across departments.
const EmployeeDepartment = SequelizeInstance.define("employeeDepartment", {

    id_employeeDepartment: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    id_employee: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },

    id_department: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
});

export default EmployeeDepartment;
