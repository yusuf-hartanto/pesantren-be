'use strict';

import { v4 as uuidv4 } from 'uuid';
import AppRole from '../role/role.model';
import AreaProvince from '../../area/provinces.model';
import AreaRegency from '../../area/regencies.model';
import { DataTypes, Model, Sequelize } from 'sequelize';
import Pegawai from '../pegawai/pegawai.model';

export class AppResource extends Model {
  declare resource_id: string;
  declare role_id: string;
  declare username: string;
  declare email: string;
  declare password: string;
  declare full_name: string;
  declare place_of_birth: string;
  declare date_of_birth: string;
  declare usia: number;
  declare telepon: string;
  declare image_foto: string;
  declare total_login: number;
  declare area_province_id: string;
  declare area_regencies_id: string;
  declare confirm_hash: string;
  declare status: string;
  declare token: string;
  declare token_expired: string;
  declare created_by: string;
  declare created_date: Date;
  declare modified_by: string;
  declare modified_date: Date;
  declare id_eksternal: string;
}

export function initAppResourceModel(sequelize: Sequelize) {
  AppResource.init(
    {
      resource_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      role_id: {
        type: DataTypes.STRING,
      },
      username: {
        type: DataTypes.STRING,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
      },
      full_name: {
        type: DataTypes.STRING,
      },
      place_of_birth: {
        type: DataTypes.STRING,
      },
      date_of_birth: {
        type: DataTypes.DATEONLY,
      },
      usia: {
        type: DataTypes.INTEGER,
      },
      telepon: {
        type: DataTypes.STRING(100),
      },
      image_foto: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.STRING(3),
        defaultValue: 'NV',
      },
      total_login: {
        type: DataTypes.INTEGER,
      },
      area_province_id: {
        type: DataTypes.STRING,
      },
      area_regencies_id: {
        type: DataTypes.STRING,
      },
      confirm_hash: {
        type: DataTypes.STRING,
      },
      token: {
        type: DataTypes.STRING,
      },
      token_expired: {
        type: DataTypes.DATE,
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
      id_eksternal: {
        type: DataTypes.STRING,
      }
    },
    {
      sequelize,
      modelName: 'AppResource',
      tableName: 'app_resource',
      timestamps: false,
    }
  );

  AppResource.beforeCreate((row) => {
    row?.setDataValue('resource_id', uuidv4());
  });
  return AppResource;
}

export function associateAppResource() {
  AppResource.belongsTo(AppRole, { as: 'role', foreignKey: 'role_id' });
  AppResource.belongsTo(AreaProvince, {
    as: 'province',
    foreignKey: 'area_province_id',
  });
  AppResource.belongsTo(AreaRegency, {
    as: 'regency',
    foreignKey: 'area_regencies_id',
  });
  AppResource.belongsTo(Pegawai, {
    as: 'pegawai',
    foreignKey: 'id_eksternal',
  })
}

export default AppResource;
