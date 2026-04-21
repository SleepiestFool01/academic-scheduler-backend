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
  id_department: {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  durationWeeks: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  id_semester: {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
});

export default Template;
