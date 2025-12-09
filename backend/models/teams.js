'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Team extends Model {
    static associate(models) {
      this.belongsTo(models.Club, {
        foreignKey: 'clubId',
        as: 'club',
      });

      this.belongsTo(models.User, {
        foreignKey: 'coachId',
        as: 'coach',
      });
    }
  }

  Team.init(
    {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      clubId: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      name: { 
        type: DataTypes.STRING(150), 
        allowNull: false 
      },
      category: { 
        type: DataTypes.STRING(50), 
        allowNull: false 
      },
      coachId: { 
        type: DataTypes.INTEGER, 
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
      modelName: 'Team',
      tableName: 'teams',
      timestamps: true,
    }
  );

  return Team;
};
