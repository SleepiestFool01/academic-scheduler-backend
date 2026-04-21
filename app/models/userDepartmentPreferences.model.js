import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const UserDepartmentPreferences = SequelizeInstance.define("userDepartmentPreferences", {

    id_userDepartmentPreferences: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    id_employee: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },

    id_department: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },

    // All Settings-page toggles serialized as a single JSON string so we can
    // add/remove preferences without migrations. Stored as TEXT (not JSON
    // column) for MySQL compatibility; parsed/stringified in the controller.
    preferences: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "{}",
    },

}, {
    indexes: [
        { unique: true, fields: ["id_employee", "id_department"] },
    ],
});

export default UserDepartmentPreferences;
