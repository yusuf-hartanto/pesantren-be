'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_perizinan_santri_status_approval
      ADD VALUE IF NOT EXISTS 'Dibatalkan';
    `);
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {});
};
