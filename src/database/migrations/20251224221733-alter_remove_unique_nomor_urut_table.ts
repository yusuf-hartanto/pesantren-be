'use strict';

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const constraints = [
      { table: 'kelompok_pelajaran', name: 'kelompok_pelajaran_nomor_urut_key' },
      { table: 'mata_pelajaran', name: 'mata_pelajaran_nomor_urut_key' },
      { table: 'jenis_jam_pelajaran', name: 'jenis_jam_pelajaran_nomor_urut_key' },
      { table: 'jenis_guru', name: 'jenis_guru_nomor_urut_key' },
      { table: 'jam_pelajaran', name: 'jam_pelajaran_nomor_urut_key' },
    ];

    for (const item of constraints) {
      try {
        // Gunakan Raw Query DROP CONSTRAINT IF EXISTS agar lebih "silent" dan aman
        await queryInterface.sequelize.query(
          `ALTER TABLE "${item.table}" DROP CONSTRAINT IF EXISTS "${item.name}";`,
          { transaction }
        );
      } catch (error: any) {
        console.warn(`Could not remove constraint ${item.name} on table ${item.table}:`, error.message);
      }
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const constraints = [
      { table: 'kelompok_pelajaran', name: 'kelompok_pelajaran_nomor_urut_key' },
      { table: 'mata_pelajaran', name: 'mata_pelajaran_nomor_urut_key' },
      { table: 'jenis_jam_pelajaran', name: 'jenis_jam_pelajaran_nomor_urut_key' },
      { table: 'jenis_guru', name: 'jenis_guru_nomor_urut_key' },
      { table: 'jam_pelajaran', name: 'jam_pelajaran_nomor_urut_key' },
    ];

    for (const item of constraints) {
      try {
        await queryInterface.addConstraint(item.table, {
          fields: ['nomor_urut'],
          type: 'unique',
          name: item.name,
          transaction
        });
      } catch (error: any) {
        console.warn(`Could not add constraint ${item.name} on table ${item.table}:`, error.message);
      }
    }
  });
};