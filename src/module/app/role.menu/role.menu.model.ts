'use strict';

import { uuid } from 'uuidv4';
import { DataTypes } from 'sequelize';
import conn from '../../../config/database';
import Menu from '../menu/menu.model';

const Model = conn.sequelize.define(
  'app_role_menu',
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
    createdAt: false,
    updatedAt: false,
    freezeTableName: true,
  }
);

Model.beforeCreate((app_role_menu: { role_menu_id: string; }) => app_role_menu.role_menu_id = uuid());
Model.belongsTo(Menu, { as: 'menu', foreignKey: 'menu_id' });

export default Model;
