'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS app_param_global;`
  );
  await queryInterface.sequelize.query(`  
    CREATE TABLE app_param_global (
      id varchar(50) NOT NULL,
      param_key varchar(100) DEFAULT NULL,
      param_value varchar(255) DEFAULT NULL,
      param_desc varchar(255) DEFAULT NULL,
      \`status\` int(1) unsigned DEFAULT NULL,
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
    `DROP TABLE IF EXISTS app_param_global;`
  );
};
