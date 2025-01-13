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

  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS app_resource;`);
  await queryInterface.sequelize.query(`
    CREATE TABLE app_resource (
      resource_id varchar(50) NOT NULL,
      role_id varchar(50) DEFAULT NULL,
      username varchar(100) DEFAULT NULL,
      email varchar(255) DEFAULT NULL,
      password varchar(255) DEFAULT NULL,
      full_name varchar(255) DEFAULT NULL,
      place_of_birth varchar(255) DEFAULT NULL,
      date_of_birth date DEFAULT NULL,
      usia int(3) unsigned DEFAULT 0,
      telepon varchar(100) DEFAULT NULL,
      image_foto varchar(255) DEFAULT NULL,
      \`status\` varchar(3) DEFAULT NULL,
      total_login int(11) unsigned DEFAULT 0,
      area_province_id varchar(50) DEFAULT NULL,
      area_regencies_id varchar(50) DEFAULT NULL,
      confirm_hash varchar(255) DEFAULT NULL,
      token text,
      created_by varchar(50) DEFAULT NULL,
      created_date datetime DEFAULT NULL,
      modified_by varchar(50) DEFAULT NULL,
      modified_date datetime DEFAULT NULL,
      PRIMARY KEY (resource_id),
      UNIQUE KEY unique_resource_id_username_email (resource_id,username,email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS app_role;`);
  await queryInterface.sequelize.query(`
    CREATE TABLE app_role (
      role_id varchar(50) NOT NULL,
      role_name varchar(255) DEFAULT NULL,
      \`status\` int(1) DEFAULT NULL,
      restrict_level_area int(1) DEFAULT NULL,
      created_by varchar(50) DEFAULT NULL,
      created_date datetime DEFAULT NULL,
      modified_by varchar(50) DEFAULT NULL,
      modified_date datetime DEFAULT NULL,
      PRIMARY KEY (role_id),
      UNIQUE KEY unique_role_id (role_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS app_role_menu;`);
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

  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS area_provinces;`);
  await queryInterface.sequelize.query(`
    CREATE TABLE area_provinces (
      id varchar(50) NOT NULL,
      name varchar(255) DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY unique_id (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS area_regencies;`);
  await queryInterface.sequelize.query(`
    CREATE TABLE area_regencies (
      id varchar(50) NOT NULL,
      area_province_id varchar(50) DEFAULT NULL,
      name varchar(255) DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY unique_id (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

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

  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS policy_detail;`);
  await queryInterface.sequelize.query(`
    CREATE TABLE policy_detail (
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

  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS survey_event;`);
  await queryInterface.sequelize.query(`
    CREATE TABLE survey_event (
      id varchar(50) NOT NULL,
      form_id varchar(50) NOT NULL,
      \`event\` varchar(255) DEFAULT NULL,
      \`desc\` varchar(255) DEFAULT NULL,
      start_period datetime DEFAULT NULL,
      end_period datetime DEFAULT NULL,
      is_active int(1) DEFAULT 1 COMMENT '1:active;0:not active',
      is_random int(11) NOT NULL DEFAULT 0 COMMENT '0:berurut asc;1:acak;2:berurut desc;',
      created_by varchar(50) DEFAULT NULL,
      created_date datetime DEFAULT NULL,
      modified_by varchar(50) DEFAULT NULL,
      modified_date datetime DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY unique_id (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS survey_form;`);
  await queryInterface.sequelize.query(`
    CREATE TABLE survey_form (
      question_id varchar(50) NOT NULL,
      form_id varchar(50) NOT NULL,
      question varchar(255) DEFAULT NULL,
      parent_id varchar(50) DEFAULT NULL,
      type varchar(20) DEFAULT NULL,
      nourut int(11) DEFAULT NULL,
      url_image1 varchar(255) DEFAULT NULL,
      url_image2 varchar(255) DEFAULT NULL,
      is_active int(1) DEFAULT 1 COMMENT '1:active;0:not active',
      created_by varchar(50) DEFAULT NULL,
      created_date datetime DEFAULT NULL,
      modified_by varchar(50) DEFAULT NULL,
      modified_date datetime DEFAULT NULL,
      PRIMARY KEY (question_id),
      UNIQUE KEY unique_question_id (question_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS survey_form_answer;`
  );
  await queryInterface.sequelize.query(`
    CREATE TABLE survey_form_answer (
      answer_id varchar(50) NOT NULL,
      question_id varchar(50) NOT NULL,
      text_answer varchar(255) DEFAULT NULL,
      alert_answer longtext,
      nourut int(11) DEFAULT NULL,
      created_by varchar(50) DEFAULT NULL,
      created_date datetime DEFAULT NULL,
      modified_by varchar(50) DEFAULT NULL,
      modified_date datetime DEFAULT NULL,
      PRIMARY KEY (answer_id),
      UNIQUE KEY unique_answer_id (answer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS survey_form_answer_value;`
  );
  await queryInterface.sequelize.query(`
    CREATE TABLE survey_form_answer_value (
      id varchar(50) NOT NULL,
      client_id varchar(50) NOT NULL,
      event_id varchar(50) NOT NULL,
      form_id varchar(50) NOT NULL,
      question_id varchar(50) NOT NULL,
      question varchar(255) DEFAULT NULL,
      text_answer varchar(255) DEFAULT NULL,
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
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS app_menu;`);
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS app_param_global;`
  );
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS app_resource;`);
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS app_role;`);
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS app_role_menu;`);
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS area_provinces;`);
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS area_regencies;`);
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS client;`);
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS insurance_policy;`
  );
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS insurance_record;`
  );
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS policy_detail;`);
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS survey_event;`);
  await queryInterface.sequelize.query(`DROP TABLE IF EXISTS survey_form;`);
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS survey_form_answer;`
  );
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS survey_form_answer_value;`
  );
};
