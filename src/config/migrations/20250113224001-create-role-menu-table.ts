'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`
    CREATE TABLE app_role_menu (
      role_menu_id varchar(50) NOT NULL,
      role_id varchar(50) NOT NULL,
      menu_id varchar(50) NOT NULL,
      \`create\` int(1) unsigned DEFAULT NULL,
      edit int(1) unsigned DEFAULT NULL,
      \`delete\` int(1) unsigned DEFAULT NULL,
      approve int(1) unsigned DEFAULT NULL,
      \`status\` int(1) unsigned DEFAULT NULL,
      created_by varchar(50) DEFAULT NULL,
      created_date datetime DEFAULT NULL,
      modified_by varchar(50) DEFAULT NULL,
      modified_date datetime DEFAULT NULL,
      PRIMARY KEY (role_menu_id),
      UNIQUE KEY unique_role_menu_id (role_id,menu_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS app_role_menu;`);
};
