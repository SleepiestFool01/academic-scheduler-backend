import Sequelize from "sequelize";
import SequelizeInstance from"../config/sequelizeInstance.js";

const Department = SequelizeInstance.define("department", {
    id_department: {
        type: Sequelize.INTEGER, 
        autoincrement: true,
        primaryKey: true,
    },

    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "Student Scheduling System",
    },
});

export default Department;
