'use strict';

import AreaProvince from './provinces.model';
import AreaRegency from './regencies.model';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class AreaDistrict extends Model {
  public id!: string;
  public area_province_id!: string;
  public area_regencies_id!: string;
  public name!: string;
}

export function initAreaDistrict(sequelize: Sequelize) {
  AreaDistrict.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      area_province_id: {
        type: DataTypes.STRING,
      },
      area_regencies_id: {
        type: DataTypes.STRING,
      },
      name: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: 'AreaDistrict',
      tableName: 'area_districts',
      timestamps: false,
    }
  );
  return AreaDistrict;
}

export function associateAreaDistrict() {
  AreaDistrict.belongsTo(AreaProvince, {
    as: 'province',
    targetKey: 'id',
    foreignKey: 'area_province_id',
  });
  AreaDistrict.belongsTo(AreaRegency, {
    as: 'regency',
    targetKey: 'id',
    foreignKey: 'area_regencies_id',
  });
}

export default AreaDistrict;
