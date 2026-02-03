import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Employee = SequelizeInstance.define("employee", {

    //Primary Key 
    id_employee: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
        defaultValue: "Share your goals, experience, or anything your coach should know.",
    },

});

export default Employee;