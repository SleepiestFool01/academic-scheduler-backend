import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

// Per-department academic semester bounds. The "active" semester for any
// given moment is whichever row's [startDate, endDate] contains today;
// that semester's `name` is matched against EmployeeUnavailability.season
// for conflict detection. Distinct from the settings-based "Active Season"
// value which is tied to hours-of-operation reuse across years.
const Semester = SequelizeInstance.define("semester", {
    id_semester: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_department: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    name: {
        type: Sequelize.STRING,
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

export default Semester;
