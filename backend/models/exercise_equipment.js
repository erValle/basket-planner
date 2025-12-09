'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ExerciseEquipment extends Model {
    static associate(models) {
      this.belongsTo(models.Exercise, {
        foreignKey: 'exerciseId',
        as: 'exercise',
      });

      this.belongsTo(models.Equipment, {
        foreignKey: 'equipmentId',
        as: 'equipmentItem',
      });
    }
  }

  ExerciseEquipment.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      exerciseId: { type: DataTypes.INTEGER, allowNull: false },
      equipmentId: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    {
      sequelize,
      modelName: 'ExerciseEquipment',
      tableName: 'exercise_equipment',
      timestamps: true,
    }
  );

  return ExerciseEquipment;
};
