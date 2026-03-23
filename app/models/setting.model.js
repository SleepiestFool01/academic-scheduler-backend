import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Setting = SequelizeInstance.define("setting", {
  //Primary Key
  id_setting: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: Sequelize.STRING,
    allowNull: true,
  },

  key: {
    type: Sequelize.STRING,
    allowNull: true,
  },

  // example types: BOOLEAN, STRING, NUMBER, LIST; stored as string to keep flexible
  type: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  description: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  code: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

export default Setting;
