import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

// Tracks per-task completion for a given ShiftTaskList assignment.
// One row per task per shift-tasklist assignment.
// Created automatically when a TaskList is assigned to a Shift.
const ShiftTaskListStatus = SequelizeInstance.define("shiftTaskListStatus", {

    //Primary Key
    id_shiftTaskListStatus: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // FK to ShiftTaskList (the shift ↔ task-list assignment)
    id_shiftTaskList: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    // FK to the individual Task
    id_task: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    // Whether the employee has marked this task complete
    isCompleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },

});

export default ShiftTaskListStatus;
