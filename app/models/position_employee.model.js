import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js"

const position_employee = SequelizeInstance.define("position_employee", {
    
    id_position_employee:{
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

})