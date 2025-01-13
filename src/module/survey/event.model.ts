'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes } from 'sequelize';
import conn from '../../config/database';

const Model = conn.sequelize.define(
  'survey_event',
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
    },
    form_id: {
      type: DataTypes.STRING,
    },
    event: {
      type: DataTypes.STRING,
    },
    desc: {
      type: DataTypes.STRING,
    },
    start_period: {
      type: DataTypes.DATE,
    },
    end_period: {
      type: DataTypes.DATE,
    },
    is_active: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    is_random: {
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
  (survey_event: { id: string }) => (survey_event.id = uuidv4())
);

export default Model;
