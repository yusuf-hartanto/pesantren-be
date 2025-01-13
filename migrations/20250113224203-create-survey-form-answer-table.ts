'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS survey_form_answer;`
  );
  await queryInterface.sequelize.query(`
    CREATE TABLE survey_form_answer (
      answer_id varchar(50) NOT NULL,
      question_id varchar(50) NOT NULL,
      text_answer varchar(255) DEFAULT NULL,
      alert_answer longtext,
      nourut int(11) DEFAULT NULL,
      created_by varchar(50) DEFAULT NULL,
      created_date datetime DEFAULT NULL,
      modified_by varchar(50) DEFAULT NULL,
      modified_date datetime DEFAULT NULL,
      PRIMARY KEY (answer_id),
      UNIQUE KEY unique_answer_id (answer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS survey_form_answer;`
  );
};
