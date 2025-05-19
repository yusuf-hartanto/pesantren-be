'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`
    CREATE TABLE app_menu (
      menu_id varchar(50) NOT NULL,
      menu_name varchar(255) DEFAULT NULL,
      menu_icon varchar(255) DEFAULT NULL,
      module_name text DEFAULT NULL,
      type_menu varchar(1) DEFAULT NULL,
      seq_number int DEFAULT NULL,
      parent_id varchar(50) DEFAULT NULL,
      status int DEFAULT NULL,
      created_by varchar(50) DEFAULT NULL,
      created_date timestamp DEFAULT NULL,
      modified_by varchar(50) DEFAULT NULL,
      modified_date timestamp DEFAULT NULL,
      PRIMARY KEY (menu_id),
      UNIQUE (menu_id)
    );
  `);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS app_menu;`);
};
