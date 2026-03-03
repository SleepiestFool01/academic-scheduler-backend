import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Task = SequelizeInstance.define("task", {

    //Primary Key
    id_task: {
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
    // Optional FK — tasks can exist standalone (not in a list)
    // field: maps the JS attribute name to the existing DB column (created lowercase by old model)
    id_taskList: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'id_tasklist',
    },

});

export default Task;
