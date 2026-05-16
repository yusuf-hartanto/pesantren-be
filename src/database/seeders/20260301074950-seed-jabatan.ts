'use strict';

import { QueryInterface, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface: QueryInterface, sequelize: Sequelize) {
    // 1. Ambil hanya SATU data orgunit (Limit 1)
    const [units]: any = await queryInterface.sequelize.query(
      'SELECT id_orgunit FROM orgunit WHERE deleted_at IS NULL LIMIT 1'
    );

    if (units.length === 0) {
      console.error(
        'Gagal: Tabel orgunit kosong. Harap isi seeder orgunit terlebih dahulu.'
      );
      return;
    }

    // Ambil ID dari record tunggal tersebut
    const targetUnitId = units[0].id_orgunit;

    // 2. Masukkan data jabatan yang semuanya merujuk pada targetUnitId tersebut
    return queryInterface.bulkInsert('jabatan', [
      {
        id_jabatan: uuidv4(),
        nama_jabatan: 'Kepala Unit',
        id_orgunit: targetUnitId,
        level_jabatan: 1,
        sifat_jabatan: 'Umum',
        kode_jabatan: 'K-UNT-01',
        keterangan: 'Pimpinan unit organisasi.',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_jabatan: uuidv4(),
        nama_jabatan: 'Sekretaris Unit',
        id_orgunit: targetUnitId,
        level_jabatan: 2,
        sifat_jabatan: 'Umum',
        kode_jabatan: 'S-UNT-02',
        keterangan: 'Sekretaris unit organisasi.',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_jabatan: uuidv4(),
        nama_jabatan: 'Bendahara Unit',
        id_orgunit: targetUnitId,
        level_jabatan: 2,
        sifat_jabatan: 'Umum',
        kode_jabatan: 'B-UNT-02',
        keterangan: 'Bendahara unit organisasi.',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_jabatan: uuidv4(),
        nama_jabatan: 'Staf Administrasi',
        id_orgunit: targetUnitId,
        level_jabatan: 3,
        sifat_jabatan: 'Umum',
        kode_jabatan: 'ST-UNT-03',
        keterangan: 'Staf pelaksana administrasi.',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.bulkDelete('jabatan', {}, {});
  },
};
