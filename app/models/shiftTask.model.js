import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

// Bridge table: attach an individual Task directly to a Shift (independent
// of TaskList assignments). Tracks per-shift completion.
const ShiftTask = SequelizeInstance.define("shiftTask", {
    id_shiftTask: {
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
    isCompleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
});

export default ShiftTask;
