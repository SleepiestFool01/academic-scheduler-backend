import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Setting = SequelizeInstance.define("setting", {
  //Primary Key
  id_setting: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  type: {
    type: Sequelize.ENUM,
    allowNull: false,
  },

  description: {
    type: Sequelize.STRING,
    allowNull: false,

  },
  code: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

export default Setting;
