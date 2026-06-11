'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // Gunakan casting 'any' pada tableDesc agar akses properti dinamis diizinkan
    const tableDesc: any =
      await queryInterface.describeTable('kebersihan_temuan');

    if (!tableDesc.status) {
      await queryInterface.addColumn(
        'kebersihan_temuan',
        'status',
        {
          type: DataTypes.SMALLINT,
          allowNull: true,
          defaultValue: 0,
        },
        { transaction }
      );
    }

    if (!tableDesc.foto_path_tindakan) {
      await queryInterface.addColumn(
        'kebersihan_temuan',
        'foto_path_tindakan',
        {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        { transaction }
      );
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc: any =
      await queryInterface.describeTable('kebersihan_temuan');
    const columnsToRemove = ['status', 'foto_path_tindakan'];

    for (const columnName of columnsToRemove) {
      // Cek apakah kolom benar-benar ada di deskripsi tabel
      if (tableDesc[columnName]) {
        await queryInterface.removeColumn('kebersihan_temuan', columnName, {
          transaction,
        });
      }
    }
  });
};
