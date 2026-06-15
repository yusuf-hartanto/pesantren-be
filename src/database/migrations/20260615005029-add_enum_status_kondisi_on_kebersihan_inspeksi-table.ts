'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_kebersihan_inspeksi_status_kondisi
      ADD VALUE IF NOT EXISTS 'RUSAK';
    `);
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
  });
};
