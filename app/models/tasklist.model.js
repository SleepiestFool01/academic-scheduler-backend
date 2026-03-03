import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const TaskList = SequelizeInstance.define("taskList", {

    //Primary Key
    id_taskList: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "",
    },

});

export default TaskList;
