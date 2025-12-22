
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TrainingPlan extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdBy',
      });

      this.hasMany(models.TrainingPlanVersion, {
        foreignKey: 'trainingPlanId',
        as: 'versions',
      });

      this.belongsTo(models.TrainingPlanVersion, {
        foreignKey: 'activeVersionId',
        as: 'activeVersion',
        constraints: false,
      });

      // New: assignments to users
      this.hasMany(models.PlanAssignment, {
        foreignKey: 'trainingPlanId',
        as: 'assignments',
      });
    }
  }

  TrainingPlan.init(
    {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      createdById: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      targetType: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        defaultValue: 'individual' 
      },
      name: { 
        type: DataTypes.STRING, 
        allowNull: false 
      },
      description: { 
        type: DataTypes.TEXT, 
        allowNull: true 
      },
      goal: { 
        type: DataTypes.STRING, 
        allowNull: true 
      },
      type: { 
        type: DataTypes.STRING, 
        allowNull: true 
      },
      intensity: { 
        type: DataTypes.STRING, 
        allowNull: true 
      },
      duration: { 
        type: DataTypes.INTEGER, 
        allowNull: true 
      },
      status: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        defaultValue: 'draft' 
      },

      activeVersionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'TrainingPlan',
      tableName: 'training_plans',
      timestamps: true,
    }
  );

  return TrainingPlan;
};
