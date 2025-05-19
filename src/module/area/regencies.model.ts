'use strict';

import { v4 as uuidv4 } from 'uuid';
import AreaProvince from './provinces.model';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class AreaRegency extends Model {
  public id!: string;
  public area_province_id!: string;
  public name!: string;
}

export function initAreaRegency(sequelize: Sequelize) {
  AreaRegency.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      area_province_id: {
        type: DataTypes.STRING,
      },
      name: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: 'AreaRegency',
      tableName: 'area_regencies',
      timestamps: false,
    }
  );

  AreaRegency.beforeCreate((area_regencies) => {
    area_regencies?.setDataValue('id', uuidv4());
  });
  return AreaRegency;
}

export function associateAreaRegency() {
  AreaRegency.belongsTo(AreaProvince, {
    as: 'province',
    targetKey: 'id',
    foreignKey: 'area_province_id',
  });
}

export default AreaRegency;
