import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const TemplateShiftEmployee = SequelizeInstance.define("templateShiftEmployee", {
  id_templateShiftEmployee: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_templateShift: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  id_employee: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
});

export default TemplateShiftEmployee;
