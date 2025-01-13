'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS client;`);
  await queryInterface.sequelize.query(`
    CREATE TABLE client (
      id varchar(50) NOT NULL,
      name varchar(250) NOT NULL,
      bod date DEFAULT NULL,
      age int(11) DEFAULT NULL,
      contact_number longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
      address varchar(255) DEFAULT NULL,
      relation_id varchar(50) DEFAULT NULL,
      relation_name varchar(100) DEFAULT NULL,
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
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS client;`);
};
