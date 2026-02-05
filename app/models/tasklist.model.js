import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance";

const TaskList = SequelizeInstance.define("tasklist", {

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
    description:{
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "Task list for this shift",
    },

    //foreign key
    id_task:{
        type: Sequelize.INTEGER,
        foreignKey: true,
    },

});

export default TaskList;