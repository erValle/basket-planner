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

      this.belongsToMany(models.User, {
        through: models.TeamPlayer,
        foreignKey: 'teamId',
        otherKey: 'userId',
        as: 'players',
      });

      this.hasMany(models.TeamPlayer, {
        foreignKey: 'teamId',
        as: 'teamPlayers',
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
        allowNull: true 
      },
      coachId: { 
        type: DataTypes.INTEGER, 
        allowNull: true 
      },
      active: { 
        type: DataTypes.BOOLEAN, 
        allowNull: false, 
        defaultValue: false 
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
