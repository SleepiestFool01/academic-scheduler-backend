import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance";

const Shift = SequelizeInstance.define("shift", {

    //Primary Key
    id_shift: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },

    description:{
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "",
    },

    day:{
        type: Sequelize.ENUM("Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun", "UNDEFINED"),
        defaultValue: "UNDEFINED",
        allowNull: false,
    },

    startTime:{
        type: Sequelize.TIME,
        allowNull: false,
    },

    EndTime:{
        type: Sequelize.TIME,
        allowNull: false,
    },

});

export default Shift;