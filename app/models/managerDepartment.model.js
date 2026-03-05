import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ManagerDepartment = SequelizeInstance.define("managerDepartment", {

    id_managerDepartment: {
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

export default ManagerDepartment;
