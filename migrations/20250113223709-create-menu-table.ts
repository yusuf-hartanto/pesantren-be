'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS app_menu;`);
  await queryInterface.sequelize.query(`
    CREATE TABLE app_menu (
      menu_id varchar(50) NOT NULL,
      menu_name varchar(255) DEFAULT NULL,
      menu_icon varchar(255) DEFAULT NULL,
      module_name text,
      type_menu varchar(1) DEFAULT NULL,
      seq_number int(2) DEFAULT NULL,
      parent_id varchar(50) DEFAULT NULL,
      \`status\` int(1) DEFAULT NULL,
      created_by varchar(50) DEFAULT NULL,
      created_date datetime DEFAULT NULL,
      modified_by varchar(50) DEFAULT NULL,
      modified_date datetime DEFAULT NULL,
      PRIMARY KEY (menu_id),
      UNIQUE KEY unique_menu_id (menu_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS app_menu;`);
};
