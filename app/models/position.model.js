import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance";

const Position = SequelizeInstance.define("position", {

    //Primary Key
    id_position: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },

    avgPayRate:{
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Short Description of task to be completed...",
    },

    //foreign key
    id_department:{
        type: Sequelize.INTEGER,
        foreignKey: true,
    },

});

export default Position;
