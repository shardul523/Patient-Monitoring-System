const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  class Patient extends Model {
    static associate(models) {
      // Define associations here when needed
    }
  }
  
  Patient.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: {
            args: [['male', 'female', 'other', 'prefer not to say']],
            msg: 'Gender must be male, female, other, or prefer not to say',
          },
        },
      },
      contactNumber: {
        type: DataTypes.STRING,
        validate: {
          is: /^(\+\d{1,3}[- ]?)?\d{10}$/,
        },
      },
      email: {
        type: DataTypes.STRING,
        validate: {
          isEmail: true,
        },
      },
      address: {
        type: DataTypes.TEXT,
      },
      medicalHistory: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: 'Patient',
      tableName: 'patients',
      timestamps: true,
      paranoid: true, // Soft deletes
    }
  );
  
  return Patient;
};