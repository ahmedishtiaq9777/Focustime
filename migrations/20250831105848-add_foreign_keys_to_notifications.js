"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint("Notifications", {
      fields: ["userId"],
      type: "foreign key",
      name: "fk_notifications_user",
      references: {
        table: "User",
        field: "uid",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("Notifications", {
      fields: ["taskId"],
      type: "foreign key",
      name: "fk_notifications_task",
      references: {
        table: "Tasks",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "Notifications",
      "fk_notifications_user"
    );
    await queryInterface.removeConstraint(
      "Notifications",
      "fk_notifications_task"
    );
  },
};
