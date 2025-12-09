'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Club extends Model {
    static associate(models) {
      this.hasMany(models.UserClub, {
        foreignKey: 'clubId',
        as: 'userClubs',
      });

      this.hasMany(models.Team, {
        foreignKey: 'clubId',
        as: 'teams',
      });

      this.hasMany(models.Equipment, {
        foreignKey: 'clubId',
        as: 'equipment',
      });
    }
  }

  Club.init(
    {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      name: { 
        type: DataTypes.STRING, 
        allowNull: false },
      address: { 
        type: DataTypes.STRING, 
        allowNull: true },
      active: { 
        type: DataTypes.BOOLEAN, 
        allowNull: false, 
        defaultValue: true },
    },
    {
      sequelize,
      modelName: 'Club',
      tableName: 'clubs',
      timestamps: true,
    }
  );

  return Club;
};
