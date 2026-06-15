'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // Gunakan casting 'any' pada tableDesc agar akses properti dinamis diizinkan
    const tableDesc: any = await queryInterface.describeTable('app_resource');

    if (!tableDesc.id_eksternal) {
      await queryInterface.addColumn(
        'app_resource',
        'id_eksternal',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction }
      );
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc: any = await queryInterface.describeTable('app_resource');
    const columnsToRemove = ['id_eksternal'];

    for (const columnName of columnsToRemove) {
      // Cek apakah kolom benar-benar ada di deskripsi tabel
      if (tableDesc[columnName]) {
        await queryInterface.removeColumn('app_resource', columnName, {
          transaction,
        });
      }
    }
  });
};
