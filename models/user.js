module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      uid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "user",
      },
    },
    {
      tableName: "User", // Matches your actual table name
      timestamps: false, // Because your table doesn't have createdAt/updatedAt
    }
  );

  return User;
};
