'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.addConstraint('app_resource', {
    fields: ['role_id'],
    type: 'foreign key',
    name: 'fk_app_resource_role_id',
    references: {
      table: 'app_role',
      field: 'role_id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
  await queryInterface.addConstraint('app_resource', {
    fields: ['area_province_id'],
    type: 'foreign key',
    name: 'fk_app_resource_area_province_id',
    references: {
      table: 'area_provinces',
      field: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
  await queryInterface.addConstraint('app_resource', {
    fields: ['area_regencies_id'],
    type: 'foreign key',
    name: 'fk_app_resource_area_regencies_id',
    references: {
      table: 'area_regencies',
      field: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.removeConstraint('app_resource', 'fk_app_resource_role_id');
  await queryInterface.removeConstraint('app_resource', 'fk_app_resource_area_province_id');
  await queryInterface.removeConstraint('app_resource', 'fk_app_resource_area_regencies_id');
};
