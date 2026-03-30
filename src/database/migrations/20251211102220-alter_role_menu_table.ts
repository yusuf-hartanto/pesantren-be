'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Ambil deskripsi struktur tabel saat ini
    const tableDesc = await queryInterface.describeTable('app_role_menu');

    // 2. Tambahkan kolom 'import' hanya jika belum ada
    if (!tableDesc.import) {
      await queryInterface.addColumn('app_role_menu', 'import', {
        type: DataTypes.INTEGER,
        allowNull: true,
      }, { transaction });
    }

    // 3. Tambahkan kolom 'export' hanya jika belum ada
    if (!tableDesc.export) {
      await queryInterface.addColumn('app_role_menu', 'export', {
        type: DataTypes.INTEGER,
        allowNull: true,
      }, { transaction });
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc = await queryInterface.describeTable('app_role_menu');

    // Hapus kolom hanya jika kolom tersebut ditemukan
    if (tableDesc.import) {
      await queryInterface.removeColumn('app_role_menu', 'import', { transaction });
    }

    if (tableDesc.export) {
      await queryInterface.removeColumn('app_role_menu', 'export', { transaction });
    }
  });
};