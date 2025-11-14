'use strict';

import { DataTypes, Model, Sequelize } from 'sequelize';

export class AreaProvince extends Model {
  public id!: string;
  public area_province_id!: string;
  public name!: string;
}

export function initAreaProvince(sequelize: Sequelize) {
  AreaProvince.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: 'AreaProvince',
      tableName: 'area_provinces',
      timestamps: false,
    }
  );
  return AreaProvince;
}

export function associateAreaProvince() {}

export default AreaProvince;
