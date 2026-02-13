'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TrainingPlanVersion extends Model {
    static associate(models) {
      this.belongsTo(models.TrainingPlan, {
        foreignKey: 'trainingPlanId',
        as: 'trainingPlan',
      });

      this.hasOne(models.TrainingPlan, {
        foreignKey: 'activeVersionId',
        as: 'activeForPlan',
        constraints: false,
      });

      this.hasMany(models.Feedback, {
        foreignKey: 'trainingPlanVersionId',
        as: 'feedbacks',
      });
    }
  }

  TrainingPlanVersion.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      trainingPlanId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      versionNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      source: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'automatic',
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sessions: {
        type: DataTypes.JSONB,
        allowNull: true,
      },

      // Trace of inputs/context used to create this version (ML dataset friendly)
      // e.g. { request: {...}, goals: [...], constraints: {...}, profiles: [...], model: { name, version } }
      createdFrom: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'TrainingPlanVersion',
      tableName: 'training_plan_versions',
      timestamps: true,
    }
  );

  return TrainingPlanVersion;
};
