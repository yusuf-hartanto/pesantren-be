'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Ambil deskripsi tabel saat ini
    const tableDesc = await queryInterface.describeTable('tahun_ajaran');

    // 2. Tambahkan archived_by jika belum ada
    if (!tableDesc.archived_by) {
      await queryInterface.addColumn(
        'tahun_ajaran',
        'archived_by',
        {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        { transaction }
      );
    }

    // 3. Tambahkan archived_at jika belum ada
    if (!tableDesc.archived_at) {
      await queryInterface.addColumn(
        'tahun_ajaran',
        'archived_at',
        {
          allowNull: true,
          type: DataTypes.DATE,
        },
        { transaction }
      );
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc = await queryInterface.describeTable('tahun_ajaran');

    // Hapus hanya jika kolom-kolom tersebut memang ada
    if (tableDesc.archived_by) {
      await queryInterface.removeColumn('tahun_ajaran', 'archived_by', {
        transaction,
      });
    }
    if (tableDesc.archived_at) {
      await queryInterface.removeColumn('tahun_ajaran', 'archived_at', {
        transaction,
      });
    }
  });
};
