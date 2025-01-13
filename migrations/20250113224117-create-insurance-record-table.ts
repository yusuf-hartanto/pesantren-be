'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS insurance_record;`
  );
  await queryInterface.sequelize.query(`
    CREATE TABLE insurance_record (
      id varchar(50) NOT NULL,
      policy_id varchar(50) NOT NULL,
      client_id varchar(50) NOT NULL,
      notification_date longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
      notification_type varchar(255) DEFAULT NULL,
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
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS insurance_policy;`
  );
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS insurance_record;`
  );
};
