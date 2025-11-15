'use strict';

import AreaProvince from './provinces.model';
import AreaRegency from './regencies.model';
import AreaDistrict from './districts.model';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class AreaSubDistrict extends Model {
  public id!: string;
  public area_province_id!: string;
  public area_regencies_id!: string;
  public area_district_id!: string;
  public name!: string;
}

export function initAreaSubDistrict(sequelize: Sequelize) {
  AreaSubDistrict.init(
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
      area_district_id: {
        type: DataTypes.STRING,
      },
      name: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: 'AreaSubDistrict',
      tableName: 'area_sub_districts',
      timestamps: false,
    }
  );
  return AreaSubDistrict;
}

export function associateAreaSubDistrict() {
  AreaSubDistrict.belongsTo(AreaProvince, {
    as: 'province',
    targetKey: 'id',
    foreignKey: 'area_province_id',
  });
  AreaSubDistrict.belongsTo(AreaRegency, {
    as: 'regency',
    targetKey: 'id',
    foreignKey: 'area_regencies_id',
  });
  AreaSubDistrict.belongsTo(AreaDistrict, {
    as: 'district',
    targetKey: 'id',
    foreignKey: 'area_district_id',
  });
}

export default AreaSubDistrict;
