'use strict';

import { v4 as uuidv4 } from 'uuid';
import AppResource from '../resource/resource.model';
import AppRoleMenu from '../role.menu/role.menu.model';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class AppRole extends Model {
  public role_id!: string;
  public role_name!: string;
  public status!: number;
  public restrict_level_area!: number;
  public created_by!: string;
  public created_date!: Date;
  public modified_by!: string;
  public modified_date!: Date;
}

export function initAppRole(sequelize: Sequelize) {
  AppRole.init(
    {
      role_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      role_name: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
      },
      restrict_level_area: {
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
      modelName: 'AppRole',
      tableName: 'app_role',
      timestamps: false,
    }
  );

  AppRole.beforeCreate((row) => {
    row?.setDataValue('role_id', uuidv4());
  });
  return AppRole;
}

export function associateAppRole() {
  AppRole.hasMany(AppResource, { as: 'resource', foreignKey: 'role_id' });
  AppRole.hasMany(AppRoleMenu, { as: 'role_menu', foreignKey: 'role_id' });
}

export default AppRole;
