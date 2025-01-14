'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes } from 'sequelize';
import conn from '../../../config/database';

const Model = conn.sequelize.define(
  'insurance_policy_detail',
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

Model.beforeCreate(
  (insurance_policy_detail: { id: string }) =>
    (insurance_policy_detail.id = uuidv4())
);

export default Model;
