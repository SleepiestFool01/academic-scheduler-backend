import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

// Bridge table: attach an individual Task directly to a TemplateShift.
// Applied templates materialize these into ShiftTask rows on the generated
// shifts.
const TemplateShiftTask = SequelizeInstance.define("templateShiftTask", {
    id_templateShiftTask: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_templateShift: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    id_task: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
});

export default TemplateShiftTask;
