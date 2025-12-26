'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Exercise extends Model {
    static associate(models) {
      this.belongsToMany(models.Equipment, {
        through: models.ExerciseEquipment,
        foreignKey: 'exerciseId',
        otherKey: 'equipmentId',
        as: 'equipmentItems',
      });
    }
  }
  Exercise.init(
  {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    name: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    description: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    type: { 
      type: DataTypes.ENUM('cardio', 'strength', 'flexibility', 'balance'), 
      allowNull: false 
    },
    difficulty: { 
      type: DataTypes.JSONB, 
      allowNull: false 
    },
    duration: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    tags: {
      type: DataTypes.JSONB, 
      allowNull: true 
    },
    active: { 
      type: DataTypes.BOOLEAN, 
      allowNull: false, 
      defaultValue: true 
    },
  },
  {
    sequelize,
    modelName: 'Exercise',
    tableName: 'exercises',
    timestamps: true,
  }
);

  return Exercise;
};