'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`
    CREATE TABLE app_otp (
      id varchar(50) NOT NULL,
      email varchar(50) DEFAULT NULL,
      code int DEFAULT NULL,
      status int NOT NULL DEFAULT '0',
      expired timestamp DEFAULT NULL,
      created_date timestamp DEFAULT NULL,
      modified_date timestamp DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE (id, email)
    );
  `);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS app_otp;`);
};
