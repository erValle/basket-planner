'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Metric extends Model {
    static associate(_models) {}
  }

  Metric.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      timestamp: { type: DataTypes.DATE, allowNull: false },
      cpuUsage: { type: DataTypes.FLOAT, allowNull: true },
      memoryUsage: { type: DataTypes.FLOAT, allowNull: true },
      backendStatus: { type: DataTypes.STRING, allowNull: true },
      recommenderStatus: { type: DataTypes.STRING, allowNull: true },
    },
    {
      sequelize,
      modelName: 'Metric',
      tableName: 'metrics',
      timestamps: true,
    }
  );

  return Metric;
};
