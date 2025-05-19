'use strict';

import dotenv from 'dotenv';
import { QueryInterface } from 'sequelize';
import { MYSQL, POSTGRES } from '../../utils/constant';

dotenv.config();

export const up = async (queryInterface: QueryInterface) => {
  let column = '';
  if (process.env.DB_DIALECT == POSTGRES) {
    column = `
      "view" int DEFAULT NULL,
      "create" int DEFAULT NULL,
      "edit" int DEFAULT NULL,
      "delete" int DEFAULT NULL,
    `;
  }
  if (process.env.DB_DIALECT == MYSQL) {
    column = `
      \`view\` int DEFAULT NULL,
      \`create\` int DEFAULT NULL,
      \`edit\` int DEFAULT NULL,
      \`delete\` int DEFAULT NULL,
    `;
  }
  await queryInterface.sequelize.query(`
    CREATE TABLE app_role_menu (
      role_menu_id varchar(50) NOT NULL,
      role_id varchar(50) NOT NULL,
      menu_id varchar(50) NOT NULL,
      ${column}
      approve int DEFAULT NULL,
      status int DEFAULT NULL,
      created_by varchar(50) DEFAULT NULL,
      created_date timestamp DEFAULT NULL,
      modified_by varchar(50) DEFAULT NULL,
      modified_date timestamp DEFAULT NULL,
      PRIMARY KEY (role_menu_id),
      UNIQUE (role_id,menu_id)
    );
  `);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS app_role_menu;`);
};
