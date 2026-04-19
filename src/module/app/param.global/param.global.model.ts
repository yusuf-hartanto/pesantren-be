'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class ParamGlobal extends Model {
  declare id: string;
  declare param_key: string;
  declare param_value: string;
  declare param_desc: string;
  declare status: number;
  declare created_by: string;
  declare created_date: Date;
  declare modified_by: string;
  declare modified_date: Date;
}

export function initParamGlobal(sequelize: Sequelize) {
  ParamGlobal.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      param_key: {
        type: DataTypes.STRING(100),
      },
      param_value: {
        type: DataTypes.STRING,
      },
      param_desc: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },
      created_by: {
        type: DataTypes.STRING,
      },
      created_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      modified_by: {
        type: DataTypes.STRING,
      },
      modified_date: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'ParamGlobal',
      tableName: 'app_param_global',
      timestamps: false,
    }
  );

  ParamGlobal.beforeCreate((row) => {
    row?.setDataValue('id', uuidv4());
  });
  return ParamGlobal;
}

export function associateParamGlobal() {}

export default ParamGlobal;
