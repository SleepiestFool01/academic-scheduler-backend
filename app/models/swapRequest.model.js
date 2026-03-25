import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const SwapRequest = SequelizeInstance.define("swapRequest", {

    //Primary Key
    id_swapRequest: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_shift: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },

    id_employeeRequester: { 
        type: Sequelize.INTEGER,
        allowNull: false,
    },

    id_employeeRequested: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
    },

    status: {
        type: Sequelize.ENUM("Pending", "Approved", "Denied"),
        defaultValue: "Pending",
        allowNull: false,
    },

});

export default SwapRequest;
