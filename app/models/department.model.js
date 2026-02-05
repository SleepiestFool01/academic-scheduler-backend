import sequelize from "sequelize";
import SequelizeInstance from"../config/sequelizeInstance.js";

const Department = SequelizeInstance.define("department", {
    id_department: {
        type: SequelizeInstance.INTEGER, 
        autoincrement: true,
        primaryKey: true
    },

    name: {
        type: SequelizeInstance.STRING,
        allowNull: false 
    },
    description: {
        type: SequelizeInstance.STRING,
        allowNull: true,
        defaultValue: "Student Scheduling System"
    },
});

export default Department;
