'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class AppOtp extends Model {
  public id!: string;
  public email!: string;
  public code!: number;
  public status!: number;
  public expired!: Date;
  public created_date!: Date;
  public modified_date!: Date;
}

export function initAppOtp(sequelize: Sequelize) {
  AppOtp.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
      },
      code: {
        type: DataTypes.INTEGER,
      },
      status: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },
      expired: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      created_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      modified_date: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'AppOtp',
      tableName: 'app_otp',
      timestamps: false,
    }
  );

  AppOtp.beforeCreate((app_otp) => {
    app_otp?.setDataValue('id', uuidv4());
  });
  return AppOtp;
}

export function associateAppOtp() {}

export default AppOtp;
