import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance";

const ShiftAssignment = SequelizeInstance.define("shiftassignment", {

    //Primary Key
    id_shiftassignment: {
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