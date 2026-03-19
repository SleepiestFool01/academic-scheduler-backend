import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const TemplateShiftTaskList = SequelizeInstance.define("templateShiftTaskList", {
  id_templateShiftTaskList: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_templateShift: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  id_taskList: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
});

export default TemplateShiftTaskList;
