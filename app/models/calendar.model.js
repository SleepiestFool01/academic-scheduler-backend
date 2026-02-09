// Calendar for department business hours

import Sequelize from "sequelize";
import SequelizeInstance from"../config/sequelizeInstance.js";

const Calendar = SequelizeInstance.define("calendar", {
    id_hours_of_operation: {
        type: SequelizeInstance.INTEGER, 
        autoincrement: true,
        primaryKey: true,
    },

    dayOfWeek: {
        type: Sequelize.ENUM("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",  "UNDEFINED"),
        allowNull: false,
        defaultValue: "UNDEFINED",
    },

    season: {
        type: Sequelize.ENUM("Fall", "Winter", "Spring", "Summer", "Finals", "UNDEFINED"),
        allowNull: true,
        defaultValue: "UNDEFINED",
    },

    name: {
        type: Sequelize.STRING,
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
    
});

export default Calendar;
