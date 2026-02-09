import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ShiftTaskListStatus = SequelizeInstance.define("shiftTaskListStatus", {
    //only create when a task is comepleted, then delete when the shift is deleted or the task is deleted.
    //Primary Key 
    id_shiftTaskListStatus: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    id_task:{
        type: Sequelize.INTEGER,
        allowNull: false,
    },

    id_shift:{
        type: Sequelize.INTEGER,
        allowNull: false,
    },


});

export default ShiftTaskListStatus;