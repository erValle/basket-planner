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

      this.belongsToMany(models.Team, {
        through: models.TeamPlayer,
        foreignKey: 'userId',
        otherKey: 'teamId',
        as: 'playerTeams',
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
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.VIRTUAL,
        get() {
          return `${this.firstName} ${this.lastName}`.trim();
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: DataTypes.STRING,
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
        defaultValue: 'active',
      },
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      maxCategory: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      position: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      height: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
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
