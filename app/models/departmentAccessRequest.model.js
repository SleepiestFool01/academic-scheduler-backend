import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const DepartmentAccessRequest = SequelizeInstance.define("departmentAccessRequest", {

    id_departmentAccessRequest: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    id_employeeRequester: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },

    id_department: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },

    status: {
        type: Sequelize.ENUM("Pending", "Approved", "Denied"),
        allowNull: false,
        defaultValue: "Pending",
    },

    message: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },
});

export default DepartmentAccessRequest;
