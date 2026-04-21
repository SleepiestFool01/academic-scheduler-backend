import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const TimeEntry = SequelizeInstance.define("timeEntry", {
  id_timeEntry: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_employee: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  id_shiftAssignment: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  clockInAt: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  clockOutAt: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null,
  },
  workedMinutes: {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
}, {
  indexes: [
    { fields: ["id_employee"] },
    { fields: ["id_shiftAssignment"] },
  ],
});

export default TimeEntry;
