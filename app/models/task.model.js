import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance";

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

    description:{
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Short Desciption of task to be completed...",
    },
    //foreign key
    id_tasklist:{
        type: Sequelize.INTEGER,
        foreignKey: true,
    },

});

export default Task;