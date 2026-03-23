import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const TemplateShift = SequelizeInstance.define("templateShift", {
  id_templateShift: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_template: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  dayOfWeek: {
    type: Sequelize.INTEGER,  // 0 = Sunday … 6 = Saturday
    allowNull: false,
  },
  startHour: {
    type: Sequelize.FLOAT,    // fractional hours, e.g. 9.5 = 9:30 AM
    allowNull: false,
  },
  endHour: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  label: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: "",
  },
  notes: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: "",
  },
  id_position: {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
});

export default TemplateShift;
