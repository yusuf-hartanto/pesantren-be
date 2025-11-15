'use strict';

import { v4 as uuidv4 } from 'uuid';
import AppRole from '../role/role.model';
import AreaProvince from '../../area/provinces.model';
import AreaRegency from '../../area/regencies.model';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class AppResource extends Model {
  public resource_id!: string;
  public role_id!: string;
  public username!: string;
  public email!: string;
  public password!: string;
  public full_name!: string;
  public place_of_birth!: string;
  public date_of_birth!: string;
  public usia!: number;
  public telepon!: string;
  public image_foto!: string;
  public total_login!: number;
  public area_province_id!: string;
  public area_regencies_id!: string;
  public confirm_hash!: string;
  public status!: string;
  public token!: string;
  public token_expired!: string;
  public created_by!: string;
  public created_date!: Date;
  public modified_by!: string;
  public modified_date!: Date;
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
    foreignKey: 'role_id',
  });
  AppResource.belongsTo(AreaRegency, { as: 'regency', foreignKey: 'role_id' });
}

export default AppResource;
