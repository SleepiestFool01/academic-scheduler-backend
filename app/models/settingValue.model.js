import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const SettingValue = SequelizeInstance.define("settingValue", {
//Primary Key
id_settingValue:{
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
value: {
    type: Sequelize.STRING,
    allowNull: false,
},
});

export default SettingValue;
