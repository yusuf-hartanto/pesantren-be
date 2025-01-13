'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes } from 'sequelize';
import conn from '../../config/database';

const Model = conn.sequelize.define(
  'survey_form',
  {
    question_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
    },
    form_id: {
      type: DataTypes.STRING,
    },
    question: {
      type: DataTypes.STRING,
    },
    parent_id: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.STRING,
    },
    nourut: {
      type: DataTypes.INTEGER,
    },
    url_image1: {
      type: DataTypes.STRING,
    },
    url_image2: {
      type: DataTypes.STRING,
    },
    is_active: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
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
  (survey_form: { question_id: string }) => (survey_form.question_id = uuidv4())
);

export default Model;
