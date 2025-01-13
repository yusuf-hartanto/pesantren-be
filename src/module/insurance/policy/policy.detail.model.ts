'use strict';

import { uuid } from 'uuidv4';
import { DataTypes } from 'sequelize';
import conn from '../../../config/database';

const Model = conn.sequelize.define(
  'policy_detail',
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
    },
    policy_id: {
      type: DataTypes.STRING,
    },
    unit_link: {
      type: DataTypes.TINYINT,
    },
    fund: {
      type: DataTypes.STRING,
    },
    cash_value: {
      type: DataTypes.DECIMAL,
    },
    benefit: {
      type: DataTypes.STRING,
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

Model.beforeCreate((policy_detail: { id: string; }) => policy_detail.id = uuid());

export default Model;
