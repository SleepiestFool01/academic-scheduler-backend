import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

// Bridge table: links a TaskList to a Position.
// Any Shift created with that Position will automatically receive this TaskList.
const PositionTaskList = SequelizeInstance.define("positionTaskList", {

    id_positionTaskList: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_position: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    id_taskList: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },

});

export default PositionTaskList;
