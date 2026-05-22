'use strict';

import { v4 as uuidv4 } from 'uuid';
import AppMenu from '../menu/menu.model';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class AppRoleMenu extends Model {
  declare role_menu_id: string;
  declare role_id: string;
  declare menu_id: string;
  declare create: number;
  declare edit: number;
  declare delete: number;
  declare approve: number;
  declare import: number;
  declare export: number;
  declare status: number;
  declare created_by: string;
  declare created_date: Date;
  declare modified_by: string;
  declare modified_date: Date;
}

export function initAppRoleMenu(sequelize: Sequelize) {
  AppRoleMenu.init(
    {
      role_menu_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      role_id: {
        type: DataTypes.STRING,
      },
      menu_id: {
        type: DataTypes.STRING,
      },
      view: {
        type: DataTypes.TINYINT,
      },
      create: {
        type: DataTypes.TINYINT,
      },
      edit: {
        type: DataTypes.TINYINT,
      },
      delete: {
        type: DataTypes.TINYINT,
      },
      approve: {
        type: DataTypes.TINYINT,
      },
      import: {
        type: DataTypes.TINYINT,
      },
      export: {
        type: DataTypes.TINYINT,
      },
      status: {
        type: DataTypes.TINYINT,
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
      modelName: 'AppRoleMenu',
      tableName: 'app_role_menu',
      timestamps: false,
    }
  );

  AppRoleMenu.beforeCreate((row) => {
    row?.setDataValue('role_menu_id', uuidv4());
  });
  return AppRoleMenu;
}

export function associateAppRoleMenu() {
  AppRoleMenu.belongsTo(AppMenu, { as: 'menu', foreignKey: 'menu_id' });
}

export default AppRoleMenu;
