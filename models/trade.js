'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Trade extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Trade.belongsTo(models.Portfolio, {foreingKey: 'portfolioId', as: 'portfolio'});
      Trade.belongsTo(models.Operation, {foreingKey: 'operationId', as: 'operation'});
      // define association here
    }
  };
  Trade.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    portfolioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
        references: {
          model: 'Portfolio',
          key: 'id'
        }
    },
    operationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
        references: {
          model: 'Operation',
          key: 'id'
        }
    },
    secid: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    price: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        isDecimal: true
      }
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: '2020-01-01'
    },
    comission: {
      type: DataTypes.DECIMAL(10,2),
      defaultValue: 0.00
    },
    comment: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Trade',
  });
  return Trade;
};