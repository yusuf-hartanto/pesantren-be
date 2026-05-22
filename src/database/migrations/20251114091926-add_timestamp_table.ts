'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  const tables = [
    'kelompok_pelajaran',
    'mata_pelajaran',
    'jenis_jam_pelajaran',
    'jam_pelajaran',
    'jenis_guru',
  ];

  for (const table of tables) {
    try {
      const tableDefinition = await queryInterface.describeTable(table);

      if (!tableDefinition.created_at) {
        await queryInterface.addColumn(table, 'created_at', {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        });
      }

      if (!tableDefinition.updated_at) {
        await queryInterface.addColumn(table, 'updated_at', {
          type: DataTypes.DATE,
          allowNull: true,
        });
      }
    } catch (error: any) {
      console.error(`Gagal memproses tabel ${table}:`, error.message);
      // Lanjutkan ke tabel berikutnya jika satu tabel bermasalah
    }
  }
};

export const down = async (queryInterface: QueryInterface) => {
  const tables = [
    'kelompok_pelajaran',
    'mata_pelajaran',
    'jenis_jam_pelajaran',
    'jam_pelajaran',
    'jenis_guru',
  ];

  for (const table of tables) {
    try {
      const tableDefinition = await queryInterface.describeTable(table);
      if (tableDefinition.created_at)
        await queryInterface.removeColumn(table, 'created_at');
      if (tableDefinition.updated_at)
        await queryInterface.removeColumn(table, 'updated_at');
    } catch (error: any) {
      console.error(`Gagal menghapus kolom di tabel ${table}:`, error.message);
    }
  }
};
