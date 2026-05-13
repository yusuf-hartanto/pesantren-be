'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // Gunakan casting 'any' pada tableDesc agar akses properti dinamis diizinkan
    const tableDesc: any = await queryInterface.describeTable('cabang');

    if (!tableDesc.institution_id_sitrendi) {
      await queryInterface.addColumn('cabang', 'institution_id_sitrendi', {
        type: DataTypes.STRING,
        allowNull: true,
      }, { transaction });
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc: any = await queryInterface.describeTable('cabang');
    const columnsToRemove = ['institution_id_sitrendi'];

    for (const columnName of columnsToRemove) {
      // Cek apakah kolom benar-benar ada di deskripsi tabel
      if (tableDesc[columnName]) {
        await queryInterface.removeColumn('cabang', columnName, { transaction });
      }
    }
  });
};