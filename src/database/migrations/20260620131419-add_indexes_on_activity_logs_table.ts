'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.addIndex('activity_logs', {
    fields: ['table_name'],
    name: 'activity_logs_table_name_idx',
  });
  await queryInterface.addIndex('activity_logs', {
    fields: ['record_id'],
    name: 'activity_logs_record_id_idx',
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.removeIndex('activity_logs', 'activity_logs_table_name_idx');
  await queryInterface.removeIndex('activity_logs', 'activity_logs_record_id_idx');
};
