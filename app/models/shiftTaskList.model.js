import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

// Bridge table: assigns a TaskList to a Shift.
// When created, ShiftTaskListStatus rows are auto-generated for each Task in the list.
const ShiftTaskList = SequelizeInstance.define("shiftTaskList", {

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
    id_taskList: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },

});

export default ShiftTaskList;
