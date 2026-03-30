'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  // Menggunakan Transaction agar perubahan bersifat atomik
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Cek struktur tabel saat ini
    const tableDesc = await queryInterface.describeTable('tingkat');

    // 2. Ubah kolom keterangan menjadi TEXT
    await queryInterface.changeColumn('tingkat', 'keterangan', {
      type: DataTypes.TEXT,
      allowNull: true,
    }, { transaction });

    // 3. Tambahkan kolom created_at hanya jika belum ada
    if (!tableDesc.created_at) {
      await queryInterface.addColumn('tingkat', 'created_at', {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      }, { transaction });
    }

    // 4. Tambahkan kolom updated_at hanya jika belum ada
    if (!tableDesc.updated_at) {
      await queryInterface.addColumn('tingkat', 'updated_at', {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      }, { transaction });
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc = await queryInterface.describeTable('tingkat');

    // 1. Hapus kolom created_at jika ada
    if (tableDesc.created_at) {
      await queryInterface.removeColumn('tingkat', 'created_at', { transaction });
    }

    // 2. Hapus kolom updated_at jika ada
    if (tableDesc.updated_at) {
      await queryInterface.removeColumn('tingkat', 'updated_at', { transaction });
    }

    // 3. Kembalikan kolom keterangan ke STRING
    await queryInterface.changeColumn('tingkat', 'keterangan', {
      type: DataTypes.STRING(255),
      allowNull: true,
    }, { transaction });
  });
};