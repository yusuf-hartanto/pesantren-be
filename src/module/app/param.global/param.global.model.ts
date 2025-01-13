'use strict';

import { uuid } from 'uuidv4';
import { DataTypes } from 'sequelize';
import conn from '../../../config/database';

const Model = conn.sequelize.define(
  'app_param_global',
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
    },
    param_key: {
      type: DataTypes.STRING(100),
    },
    param_value: {
      type: DataTypes.STRING,
    },
    param_desc: {
      type: DataTypes.STRING,
    },
    status: {
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
    createdAt: false,
    updatedAt: false,
    freezeTableName: true,
  }
);

Model.beforeCreate((app_param_global: { id: string; }) => app_param_global.id = uuid());

export default Model;
