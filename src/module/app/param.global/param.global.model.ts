'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class ParamGlobal extends Model {
  public id!: string;
  public param_key!: string;
  public param_value!: string;
  public param_desc!: string;
  public status!: number;
  public created_by!: string;
  public created_date!: Date;
  public modified_by!: string;
  public modified_date!: Date;
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

  ParamGlobal.beforeCreate((app_param_global) => {
    app_param_global?.setDataValue('id', uuidv4());
  });
  return ParamGlobal;
}

export function associateParamGlobal() {}

export default ParamGlobal;
