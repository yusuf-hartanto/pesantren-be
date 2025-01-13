'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS insurance_policy;`
  );
  await queryInterface.sequelize.query(`
    CREATE TABLE insurance_policy (
      policy_id varchar(50) NOT NULL,
      policy_number varchar(250) NOT NULL,
      provider_company varchar(250) NOT NULL,
      product_name varchar(250) NOT NULL,
      policy_holder int(11) DEFAULT NULL,
      insured_holder int(11) DEFAULT NULL,
      beneficiary_holder longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
      issued_date date DEFAULT NULL,
      premi_currency varchar(250) DEFAULT NULL,
      premi_value decimal(12,2) DEFAULT NULL,
      payment_term int(11) DEFAULT NULL,
      payment_term_unit varchar(100) DEFAULT NULL,
      insured_term int(11) DEFAULT NULL,
      insured_term_unit varchar(100) DEFAULT NULL,
      due_date date DEFAULT NULL,
      seller_name varchar(250) DEFAULT NULL,
      notes varchar(255) DEFAULT NULL,
      created_by varchar(50) DEFAULT NULL,
      created_date datetime DEFAULT NULL,
      modified_by varchar(50) DEFAULT NULL,
      modified_date datetime DEFAULT NULL,
      PRIMARY KEY (policy_id),
      UNIQUE KEY unique_policy_id (policy_id)
    ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
  `);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS insurance_policy;`
  );
};
