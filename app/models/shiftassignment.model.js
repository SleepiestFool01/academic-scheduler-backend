import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ShiftAssignment = SequelizeInstance.define("shiftAssignment", {

    //PRIMARY KEY
    id_shiftAssignment: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_employee: {
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

export default ShiftAssignment;
