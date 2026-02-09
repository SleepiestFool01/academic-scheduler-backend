import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Event = SequelizeInstance.define("event", {

    //Primary Key 
    id_event: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_department: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    start_time: {
        type: Sequelize.DATE,
        allowNull: false,
    },
    end_time: {
        type: Sequelize.DATE,
        allowNull: false,
    },
    //Brew Caters events off campus
    location: {
        type: Sequelize.STRING,
        allowNull: true,
    },

});

export default Employee;