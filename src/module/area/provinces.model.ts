'use strict';

import { v4 as uuidv4 } from 'uuid';
import AreaRegency from './regencies.model';
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

  AreaProvince.beforeCreate((area_provinces) => {
    area_provinces?.setDataValue('role_id', uuidv4());
  });
  return AreaProvince;
}

export function associateAreaProvince() {
  AreaProvince.hasMany(AreaRegency, {
    as: 'regency',
    foreignKey: 'area_province_id',
  });
}

export default AreaProvince;
