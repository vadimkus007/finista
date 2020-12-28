'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Portfolio extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Portfolio.belongsTo(models.User, {foreingKey: 'userId', as: 'user'}),
      Portfolio.hasMany(models.Trade, {as: 'trade'})
    }
  };
  Portfolio.init({
    id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      } 
    },
    currency: {
      type: DataTypes.ENUM('RUB', 'USD', 'EUR', 'GBP'),
      allowNull: false,
      defaultValue: 'RUB'
    },
    comission: {
      type: DataTypes.DECIMAL(8,5),
      allowNull: false,
        defaultValue: 0.00000,
        validate: {
          isDecimal: true
        }
    },
    memo: DataTypes.TEXT,
    dateopen: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: '2020-01-01',
        valudate: {
          isDate: true
        }
      },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Portfolio',
  });
  return Portfolio;
};