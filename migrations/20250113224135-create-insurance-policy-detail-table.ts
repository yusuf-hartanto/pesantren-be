'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS insurance_policy_detail;`);
  await queryInterface.sequelize.query(`
    CREATE TABLE insurance_policy_detail (
      id varchar(50) NOT NULL,
      policy_id varchar(50) NOT NULL,
      unit_link int(1) NOT NULL,
      fund longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
      cash_value decimal(12,2) DEFAULT NULL,
      benefit longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
      created_by varchar(50) DEFAULT NULL,
      created_date datetime DEFAULT NULL,
      modified_by varchar(50) DEFAULT NULL,
      modified_date datetime DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY unique_id (id)
    ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
  `);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS insurance_policy_detail;`);
};
