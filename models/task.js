module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    "Task",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      is_completed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      scheduled_for: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal("GETDATE()"), //
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      priority: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      is_important: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "Tasks", // Matches your existing SQL Server table
      timestamps: false, // No Sequelize-managed timestamps
    }
  );

  return Task;
};
