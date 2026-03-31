import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Template = SequelizeInstance.define("template", {
  id_template: {
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
});

export default Template;
