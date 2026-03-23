import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

// Links a specific real Shift back to the TemplateShift it was generated from.
// Used to propagate template edits (add/remove employees, task lists) to
// already-applied calendar shifts.
const TemplateApplicationShift = SequelizeInstance.define("templateApplicationShift", {
  id_templateApplicationShift: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_templateApplication: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  id_templateShift: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  id_shift: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
});

export default TemplateApplicationShift;
