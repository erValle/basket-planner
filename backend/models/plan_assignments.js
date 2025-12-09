
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PlanAssignment extends Model {
    static associate(models) {
      this.belongsTo(models.TrainingPlan, {
        foreignKey: 'trainingPlanId',
        as: 'trainingPlan',
      });

      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });

      this.belongsTo(models.User, {
        foreignKey: 'assignedById',
        as: 'assignedBy',
      });
    }
  }

  PlanAssignment.init(
    {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      trainingPlanId: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      userId: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      assignedById: { 
        type: DataTypes.INTEGER, 
        allowNull: true 
      },
      assignedAt: { 
        type: DataTypes.DATE, 
        allowNull: false 
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'assigned',
      },
    },
    {
      sequelize,
      modelName: 'PlanAssignment',
      tableName: 'plan_assignments',
      timestamps: true,
    }
  );

  return PlanAssignment;
};
