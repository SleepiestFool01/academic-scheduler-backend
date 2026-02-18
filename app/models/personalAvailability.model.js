import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const PersonalAvailability = SequelizeInstance.define("personalAvailability", {
    id_personalAvailability: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
     },

     //FK
    id_employee: {
        type: Sequelize.INTEGER,
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

    startTime: {
        type: Sequelize.TIME,
        allowNull: false,
    },

    endTime: {
        type: Sequelize.TIME,
        allowNull: false,
    },
});

PersonalAvailability.associate = (models) => {
    PersonalAvailability.belongsTo(models.Employee, {
      foreignKey: "id_employee",
      as: "employee",
    });
  };

export default PersonalAvailability;
