'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {

    const tableDesc: any = await queryInterface.describeTable('orang_tua_wali');

    if (!tableDesc.id_wali_sitrendi) {
      await queryInterface.addColumn(
        'orang_tua_wali',
        'id_wali_sitrendi',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction }
      );
    }

    await queryInterface.addConstraint(
      'orang_tua_wali',
      {
        fields: ['id_wali_sitrendi'],
        type: 'unique',
        name: 'unique_orang_tua_wali_id_wali_sitrendi',
        transaction
      }
    );
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {

    try {
      await queryInterface.removeConstraint(
        'orang_tua_wali',
        'unique_orang_tua_wali_id_wali_sitrendi',
        { transaction }
      );
    } catch (e) {}

    const tableDesc: any = await queryInterface.describeTable('orang_tua_wali');

    if (tableDesc.id_wali_sitrendi) {
      await queryInterface.removeColumn(
        'orang_tua_wali',
        'id_wali_sitrendi',
        { transaction }
      );
    }
  });
};