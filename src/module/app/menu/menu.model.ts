'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes } from 'sequelize';
import conn from '../../../config/database';

const Model = conn.sequelize.define(
  'app_menu',
  {
    menu_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
    },
    menu_name: {
      type: DataTypes.STRING,
    },
    menu_icon: {
      type: DataTypes.STRING,
    },
    module_name: {
      type: DataTypes.STRING,
    },
    type_menu: {
      type: DataTypes.STRING(1),
    },
    seq_number: {
      type: DataTypes.TINYINT,
    },
    parent_id: {
      type: DataTypes.STRING,
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

Model.beforeCreate(
  (app_menu: { menu_id: string }) => (app_menu.menu_id = uuidv4())
);

export default Model;
