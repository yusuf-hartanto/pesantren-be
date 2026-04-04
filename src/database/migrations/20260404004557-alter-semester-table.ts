'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {

    try {
      await queryInterface.removeConstraint('semester', 'semester_nomor_urut_key', { transaction });
    } catch (error) {
      console.log('Constraint semester_nomor_urut_key deleted, skipping...');
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    try {
      await queryInterface.addConstraint('semester', {
        fields: ['nomor_urut'],
        type: 'unique',
        name: 'semester_nomor_urut_key',
        transaction,
      });
    } catch (error) {
      console.log('Constraint semester_nomor_urut_key exists, skipping...');
    }
  });
};