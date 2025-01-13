'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS survey_event;`);
  await queryInterface.sequelize.query(`
    CREATE TABLE survey_event (
      id varchar(50) NOT NULL,
      form_id varchar(50) NOT NULL,
      \`event\` varchar(255) DEFAULT NULL,
      \`desc\` varchar(255) DEFAULT NULL,
      start_period datetime DEFAULT NULL,
      end_period datetime DEFAULT NULL,
      is_active int(1) DEFAULT 1 COMMENT '1:active;0:not active',
      is_random int(11) NOT NULL DEFAULT 0 COMMENT '0:berurut asc;1:acak;2:berurut desc;',
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
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS survey_event;`);
};
