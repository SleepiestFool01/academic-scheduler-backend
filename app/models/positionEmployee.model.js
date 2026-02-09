import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js"

const PositionEmployee = SequelizeInstance.define("positionEmployee", {

    id_positionEmployee:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    }, 
    // PK & FK
    id_position:{
        type: Sequelize.INTEGER,
        allowNull: false, 
    }, 
    // PK & FK
    id_employee:{
        type: Sequelize.INTEGER, 
        allowNull: false, 
    },

});

export default PositionEmployee;