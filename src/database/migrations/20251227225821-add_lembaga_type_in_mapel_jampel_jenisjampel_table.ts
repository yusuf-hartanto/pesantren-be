'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tables = ['mata_pelajaran', 'jenis_jam_pelajaran', 'jam_pelajaran'];

    for (const table of tables) {
      // 1. Cek apakah kolom sudah ada di tabel tersebut
      const tableDesc = await queryInterface.describeTable(table);

      if (!tableDesc.lembaga_type) {
        await queryInterface.addColumn(
          table,
          'lembaga_type',
          {
            type: DataTypes.ENUM('FORMAL', 'PESANTREN'),
            allowNull: true,
          },
          { transaction }
        );
      }
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tables = ['mata_pelajaran', 'jenis_jam_pelajaran', 'jam_pelajaran'];

    for (const table of tables) {
      const tableDesc = await queryInterface.describeTable(table);

      if (tableDesc.lembaga_type) {
        await queryInterface.removeColumn(table, 'lembaga_type', {
          transaction,
        });
      }
    }

    // Khusus PostgreSQL: Bersihkan tipe ENUM agar tidak mengotori skema
    // Catatan: Tipe ENUM biasanya dinamai oleh Sequelize dengan pola "enum_NamaTabel_NamaKolom"
    for (const table of tables) {
      try {
        await queryInterface.sequelize.query(
          `DROP TYPE IF EXISTS "enum_${table}_lembaga_type";`,
          { transaction }
        );
      } catch (e) {
        // Abaikan jika tipe tidak ditemukan atau masih digunakan tabel lain
      }
    }
  });
};
