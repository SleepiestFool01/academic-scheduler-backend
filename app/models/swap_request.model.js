import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance";

const Swap_Request = SequelizeInstance.define("swap_request", {

    //Primary Key
    id_swap_request: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_shift: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },

    id_employee :{
        type: Sequelize.INTEGER,
        allowNull: false,
    },

    status: {
        type: Sequelize.ENUM("Pending", "Approved", "Denied"),
        defaultValue: "Pending"
    }

});

export default Swap_Request;