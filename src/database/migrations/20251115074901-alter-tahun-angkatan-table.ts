'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  // 1. Ambil struktur tabel saat ini
  const tableDesc = await queryInterface.describeTable('tahun_angkatan');

  // 2. Ubah kolom keterangan menjadi TEXT
  await queryInterface.changeColumn('tahun_angkatan', 'keterangan', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  // 3. Tambahkan kolom created_at hanya jika belum ada
  if (!tableDesc.created_at) {
    await queryInterface.addColumn('tahun_angkatan', 'created_at', {
      allowNull: true,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    });
  }

  // 4. Tambahkan kolom updated_at hanya jika belum ada
  if (!tableDesc.updated_at) {
    await queryInterface.addColumn('tahun_angkatan', 'updated_at', {
      allowNull: true,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    });
  }
};

export const down = async (queryInterface: QueryInterface) => {
  const tableDesc = await queryInterface.describeTable('tahun_angkatan');

  // 1. Hapus kolom created_at jika ada
  if (tableDesc.created_at) {
    await queryInterface.removeColumn('tahun_angkatan', 'created_at');
  }

  // 2. Hapus kolom updated_at jika ada
  if (tableDesc.updated_at) {
    await queryInterface.removeColumn('tahun_angkatan', 'updated_at');
  }

  // 3. Kembalikan kolom keterangan ke STRING
  await queryInterface.changeColumn('tahun_angkatan', 'keterangan', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });
};
