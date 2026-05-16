'use strict';

import { QueryInterface, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface: QueryInterface, sequelize: Sequelize) {
    return queryInterface.bulkInsert('jenis_penilaian', [
      {
        id_penilaian: uuidv4(),
        singkatan: 'PAS',
        jenis_pengujian: 'Tulis',
        lembaga_type: 'FORMAL',
        is_ujian: 1,
        status: 'active',
        keterangan: 'Penilaian Akhir Semester Ganjil',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id_penilaian: uuidv4(),
        singkatan: 'IMT',
        jenis_pengujian: 'Lisan',
        lembaga_type: 'PESANTREN',
        is_ujian: 1,
        status: 'active',
        keterangan: 'Imtihan Syafahi Kitab Kuning',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id_penilaian: uuidv4(),
        singkatan: 'UH',
        jenis_pengujian: 'Campuran',
        lembaga_type: 'FORMAL',
        is_ujian: 0,
        status: 'active',
        keterangan: 'Ulangan Harian Rutin',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.bulkDelete('jenis_penilaian', {}, {});
  },
};
