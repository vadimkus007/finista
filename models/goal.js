'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Goal extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Goal.belongsTo(models.Portfolio, {foreingKey: 'portfolioId', as: 'portfolio'});
    }
  };
  Goal.init({
    id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
    },
    portfolioId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    secid: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10,2),
      defaultValue: 0.00,
      validate: {
        isDecimal: true
      }
    }
  }, {
    sequelize,
    modelName: 'Goal',
  });
  return Goal;
};