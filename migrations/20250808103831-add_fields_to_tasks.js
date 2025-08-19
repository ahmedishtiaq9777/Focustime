"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Tasks", "description", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("Tasks", "status", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "Not Started",
    });

    await queryInterface.addColumn("Tasks", "priority", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "Moderate",
    });

    await queryInterface.addColumn("Tasks", "image_url", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Tasks", "is_important", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });

    await queryInterface.addColumn("Tasks", "completed_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Tasks", "description");
    await queryInterface.removeColumn("Tasks", "status");
    await queryInterface.removeColumn("Tasks", "priority");
    await queryInterface.removeColumn("Tasks", "image_url");

    await queryInterface.removeColumn("Tasks", "is_important");
    await queryInterface.removeColumn("Tasks", "completed_at");
  },
};
