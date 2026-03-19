import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const TemplateApplication = SequelizeInstance.define("templateApplication", {
  id_templateApplication: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_template: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  startDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
});

export default TemplateApplication;
