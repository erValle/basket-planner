'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.hasMany(models.UserClub, {
        foreignKey: 'userId',
        as: 'userClubs',
      });
      this.hasMany(models.Team, {
        foreignKey: 'coachId',
        as: 'teams',
      });
      this.hasMany(models.TrainingPlan, {
        foreignKey: 'createdById',
        as: 'trainingPlans',
      });
      this.hasMany(models.Feedback, {
        foreignKey: 'userId',
        as: 'feedbacks',
      });
      this.hasMany(models.PlanAssignment, {
        foreignKey: 'userId',
        as: 'planAssignments',
      });
      this.hasMany(models.PlanAssignment,{
        foreignKey: 'assignedById',
        as: 'assignedPlanAssignments',
      })
    }
  }

  User.init(
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: 'enum_users_role',
        allowNull: false,
        defaultValue: 'user',
      },
      status: {
        type: 'enum_users_status',
        allowNull: false,
        defaultValue: 'pending',
      },
      dateOfBirth: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      maxCategory: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      position: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      height: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
    }
  );

  return User;
};
