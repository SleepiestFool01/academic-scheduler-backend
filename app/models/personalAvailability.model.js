import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const PersonalAvailability = SequelizeInstance.define("personalAvailability", {
    id_personalAvailability: {
        type: Sequelize.INTEGER,
        autoincrement: true,
        primaryKey: true,
     },

     //FK
    id_employee: {
        type: Sequelize.INTEGER,
        allowNull: false,
        foreignKey: true,
    },

    startDate: {
        type: Sequelize.DATE,
        allowNull: false,
    },

    endDate: {
        type: Sequelize.DATE,
        allowNull: false,
    },

    startTime: {
        type: Sequelize.TIME,
        allowNull: false,
    },

    endTime: {
        type: Sequelize.TIME,
        allowNull: false,
    },

});

export default PersonalAvailability;
