'use strict';

import { QueryInterface, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default {
  async up(queryInterface: QueryInterface, sequelize: Sequelize) {
    // 1. Ambil data ID dari tabel-tabel referensi
    const formalLembaga: any[] = await queryInterface.sequelize.query(
      'SELECT id_lembaga FROM lembaga_pendidikan_formal LIMIT 5'
    );
    const pesantrenLembaga: any[] = await queryInterface.sequelize.query(
      'SELECT id_lembaga FROM lembaga_pendidikan_kepesantrenan LIMIT 5'
    );
    const jenisPenilaian: any[] = await queryInterface.sequelize.query(
      'SELECT id_penilaian FROM jenis_penilaian LIMIT 3'
    );
    const tahunAjaran: any[] = await queryInterface.sequelize.query(
      'SELECT id_tahunajaran FROM tahun_ajaran LIMIT 1'
    );

    // Pastikan data referensi ada sebelum insert
    if (jenisPenilaian[0].length === 0 || tahunAjaran[0].length === 0) {
      console.error(
        'Gagal Seed: Data jenis_penilaian atau tahun_ajaran kosong!'
      );
      return;
    }

    type BobotRecord = {
      id_bobot: string;
      id_penilaian: string;
      lembaga_type: string;
      id_lembaga: string;
      id_tingkat: string | null;
      id_tahunajaran: string;
      bobot: number;
      status: string;
      created_at: Date;
      updated_at: Date;
    };

    const payload: BobotRecord[] = [];

    // 2. Loop untuk data Lembaga FORMAL
    formalLembaga[0].forEach((lembaga: any, index: number) => {
      payload.push({
        id_bobot: uuidv4(),
        id_penilaian: jenisPenilaian[0][0].id_penilaian,
        lembaga_type: 'FORMAL',
        id_lembaga: lembaga.id_lembaga,
        id_tingkat: null, // Bisa diisi jika ada data tingkat
        id_tahunajaran: tahunAjaran[0][0].id_tahunajaran,
        bobot: 30.0,
        status: 'Aktif',
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    // 3. Loop untuk data Lembaga PESANTREN
    pesantrenLembaga[0].forEach((lembaga: any, index: number) => {
      payload.push({
        id_bobot: uuidv4(),
        id_penilaian:
          jenisPenilaian[0][1]?.id_penilaian ||
          jenisPenilaian[0][0].id_penilaian,
        lembaga_type: 'PESANTREN',
        id_lembaga: lembaga.id_lembaga,
        id_tingkat: null,
        id_tahunajaran: tahunAjaran[0][0].id_tahunajaran,
        bobot: 50.0,
        status: 'Aktif',
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    if (payload.length > 0) {
      return queryInterface.bulkInsert('jenis_penilaian_bobot', payload);
    }
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.bulkDelete('jenis_penilaian_bobot', {}, {});
  },
};
