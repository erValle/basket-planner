'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Equipment extends Model {
    static associate(models) {
      this.belongsTo(models.Club, {
        foreignKey: 'clubId',
        as: 'club',
      });

      this.belongsToMany(models.Exercise, {
        through: models.ExerciseEquipment,
        foreignKey: 'equipmentId',
        otherKey: 'exerciseId',
        as: 'exercises',
      });
    }
  }

  Equipment.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      clubId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      characteristics: { type: DataTypes.JSON, allowNull: true },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'available' },
    },
    {
      sequelize,
      modelName: 'Equipment',
      tableName: 'equipment',
      timestamps: true,
    }
  );

  return Equipment;
};
