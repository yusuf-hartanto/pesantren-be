'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes } from 'sequelize';
import conn from '../../config/database';

const Model = conn.sequelize.define(
  'survey_form_answer',
  {
    answer_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
    },
    question_id: {
      type: DataTypes.STRING,
    },
    text_answer: {
      type: DataTypes.STRING,
    },
    alert_answer: {
      type: DataTypes.STRING,
    },
    nourut: {
      type: DataTypes.INTEGER,
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
  (survey_form_answer: { answer_id: string }) =>
    (survey_form_answer.answer_id = uuidv4())
);

export default Model;
