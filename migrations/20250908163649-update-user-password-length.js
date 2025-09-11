"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("User", "password", {
      type: Sequelize.STRING(255), // bcrypt needs at least 60 chars
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("User", "password", {
      type: Sequelize.STRING(50),
      allowNull: false,
    });
  },
};
