import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

// Recurring weekly unavailability — covers student class schedules (source:
// "imported", always season-scoped) and employee-entered manual blocks
// (source: "manual", season- OR date-range-scoped). One row per weekly
// occurrence; managers read this alongside approved time-off when deciding
// whom to assign.
const EmployeeUnavailability = SequelizeInstance.define("employeeUnavailability", {
    id_employeeUnavailability: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    id_employee: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },

    dayOfWeek: {
        type: Sequelize.ENUM("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"),
        allowNull: false,
    },

    startTime: {
        type: Sequelize.TIME,
        allowNull: false,
    },

    endTime: {
        type: Sequelize.TIME,
        allowNull: false,
    },

    // "season" = active semester, "dateRange" = custom start/end dates.
    // Imported class-schedule rows are always "season".
    scopeType: {
        type: Sequelize.ENUM("season", "dateRange"),
        allowNull: false,
        defaultValue: "season",
    },

    season: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },

    startDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
    },

    endDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
    },

    source: {
        type: Sequelize.ENUM("manual", "imported"),
        allowNull: false,
        defaultValue: "manual",
    },

    // Short description of the commitment ("BIOL 101", "Gym"). Optional.
    label: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },

    // When true, controller strips `label` for any caller other than the
    // row's owner or an Admin — manager sees "Unavailable" not the reason.
    hideReason: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
});

EmployeeUnavailability.associate = (models) => {
    EmployeeUnavailability.belongsTo(models.Employee, {
        foreignKey: "id_employee",
        as: "employee",
    });
};

export default EmployeeUnavailability;
