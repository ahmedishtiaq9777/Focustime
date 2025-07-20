'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
 up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('User', 'email', {
      type: Sequelize.STRING,
      allowNull: true,

     
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('User', 'email');
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
