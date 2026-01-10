'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserClub extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });

      this.belongsTo(models.Club, {
        foreignKey: 'clubId',
        as: 'club',
      });
    }
  }

  UserClub.init(
    {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      userId: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      clubId: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      isPrimary: { 
        type: DataTypes.BOOLEAN, 
        allowNull: false, 
        defaultValue: false 
      },
      startDate: { 
        type: DataTypes.DATEONLY, 
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      endDate: { 
        type: DataTypes.DATEONLY, 
        allowNull: true 
      },
    },
    {
      sequelize,
      modelName: 'UserClub',
      tableName: 'user_clubs',
      timestamps: true,
    }
  );

  return UserClub;
};
