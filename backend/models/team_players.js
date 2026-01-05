'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TeamPlayer extends Model {
    static associate(models) {
      // join model for many-to-many Team <-> User (players)
      this.belongsTo(models.Team, { foreignKey: 'teamId', as: 'team' });
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  TeamPlayer.init(
    {
      teamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      sequelize,
      modelName: 'TeamPlayer',
      tableName: 'team_players',
      timestamps: true,
    }
  );

  return TeamPlayer;
};
