'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Moex extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Moex.init({
    request: {
      type: DataTypes.STRING,
      allowNull: false
    },
    responce: {
      type: DataTypes.TEXT,
      allowNull: false,
      get: function() {
        return JSON.parse(this.getDataValue('responce'));
      },
      set: function(value) {
        return this.setDataValue('responce', JSON.stringify(value));
      }
    },
    permanent: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Moex',
  });
  return Moex;
};