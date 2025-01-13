'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS survey_form_answer_value;`
  );
  await queryInterface.sequelize.query(`
    CREATE TABLE survey_form_answer_value (
      id varchar(50) NOT NULL,
      client_id varchar(50) NOT NULL,
      event_id varchar(50) NOT NULL,
      form_id varchar(50) NOT NULL,
      question_id varchar(50) NOT NULL,
      question varchar(255) DEFAULT NULL,
      text_answer varchar(255) DEFAULT NULL,
      created_by varchar(50) DEFAULT NULL,
      created_date datetime DEFAULT NULL,
      modified_by varchar(50) DEFAULT NULL,
      modified_date datetime DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY unique_id (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS survey_form_answer_value;`
  );
};
