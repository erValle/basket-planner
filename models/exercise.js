'use strict';
const {
  Model
} = require('sequelize');

const CATEGORIES = ['shooting', 'dribbling', 'passing', 'defense', 'strength', 'agility', 'tactics', 'endurance'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

module.exports = (sequelize, DataTypes) => {
  class Exercise extends Model {
    static associate(models) {
    }
  }
  Exercise.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name:{
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM(...CATEGORIES),
      allowNull: false
    },
    difficulty: {
      type: DataTypes.ENUM(...DIFFICULTIES),
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 300
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    weights: {
      type: DataTypes.JSON,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'Exercise',
    tableName: 'exercises'
  });
  
  return Exercise;
};