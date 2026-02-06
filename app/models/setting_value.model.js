import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Setting_Value = SequelizeInstance.define("setting_value", {
//Primary Key
id_setting_value:{
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
}, 
// PK & FK
id_setting:{
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
}, 
// PK & FK
id_department:{
    type: Sequelize.INTEGER, 
    allowNull: false, 
    foreignKey: true,
},
});

export default Setting_Value;
