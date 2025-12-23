'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Feedback extends Model {
    static associate(models) {
      this.belongsTo(models.TrainingPlanVersion, {
        foreignKey: 'trainingPlanVersionId',
        as: 'trainingPlanVersion',
      });

      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    }
  }

  Feedback.init(
    {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      trainingPlanVersionId: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      userId: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      rating: { 
        type: DataTypes.JSON, 
        allowNull: false 
      },
      comments: { 
        type: DataTypes.TEXT, 
        allowNull: true 
      },
    },
    {
      sequelize,
      modelName: 'Feedback',
      tableName: 'feedbacks',
      timestamps: true,
    }
  );

  return Feedback;
};
