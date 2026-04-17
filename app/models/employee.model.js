import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Employee = SequelizeInstance.define("employee", {

    //Primary Key 
    id_employee: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    role: {
        type: Sequelize.ENUM("Employee", "Manager", "Admin"),
        allowNull: false,
        defaultValue: "Employee",   
    },

    fName: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    lName: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    bio: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: "Add any notes that help managers schedule and support this employee.",
    },
    color: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },
    id_department: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
});

export default Employee;
