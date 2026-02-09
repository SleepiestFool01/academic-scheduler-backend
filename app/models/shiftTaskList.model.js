import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ShiftTaskList = SequelizeInstance.define("shiftTaskList`", {

    //Primary Key 
    id_shiftTaskList: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_shift: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    id_task: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },

});

export default ShiftTaskList;