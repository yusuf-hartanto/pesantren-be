'use strict';

import { QueryInterface, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface: QueryInterface, sequelize: Sequelize) {
    // 1. Ambil ID referensi dari tabel terkait
    const [cabangs]: any = await queryInterface.sequelize.query("SELECT id_cabang FROM cabang LIMIT 1");
    const [formal]: any = await queryInterface.sequelize.query("SELECT id_lembaga FROM lembaga_pendidikan_formal LIMIT 1");
    const [pesantren]: any = await queryInterface.sequelize.query("SELECT id_lembaga FROM lembaga_pendidikan_kepesantrenan LIMIT 1");

    if (cabangs.length === 0) {
      console.error('Gagal: Tabel cabang kosong. Harap isi seeder cabang terlebih dahulu.');
      return;
    }

    const idCabang = cabangs[0].id_cabang;
    const idFormal = formal.length > 0 ? formal[0].id_lembaga : null;
    const idPesantren = pesantren.length > 0 ? pesantren[0].id_lembaga : null;

    // 2. Definisikan ID manual untuk Parent agar bisa direferensikan oleh Child
    const idBiroUmum = uuidv4();
    const idBagianAkademik = uuidv4();

    return queryInterface.bulkInsert('orgunit', [
      // --- LEVEL 0: Biro (Top Level) ---
      {
        id_orgunit: idBiroUmum,
        nama_orgunit: 'Biro Administrasi Umum',
        parent_id: null,
        level_orgunit: 0,
        id_cabang: idCabang,
        id_lembaga: null,
        jenis_orgunit: 'Biro',
        lembaga_type: null,
        keterangan: 'Unit tertinggi pengelola administrasi umum.',
        created_at: new Date(),
        updated_at: new Date()
      },

      // --- LEVEL 1: Bagian (Child of Biro Umum) ---
      {
        id_orgunit: idBagianAkademik,
        nama_orgunit: 'Bagian Kurikulum & Akademik',
        parent_id: idBiroUmum,
        level_orgunit: 1,
        id_cabang: idCabang,
        id_lembaga: null,
        jenis_orgunit: 'Bagian',
        lembaga_type: null,
        keterangan: 'Mengelola standarisasi kurikulum pusat.',
        created_at: new Date(),
        updated_at: new Date()
      },

      // --- LEVEL 2: Sub-Unit (Terkait Lembaga Formal) ---
      {
        id_orgunit: uuidv4(),
        nama_orgunit: 'Tata Usaha Sekolah',
        parent_id: idBagianAkademik,
        level_orgunit: 2,
        id_cabang: idCabang,
        id_lembaga: idFormal, // Menghubungkan ke Lembaga Formal
        jenis_orgunit: 'Sub-Unit',
        lembaga_type: 'FORMAL',
        keterangan: 'Administrasi khusus untuk lembaga pendidikan formal.',
        created_at: new Date(),
        updated_at: new Date()
      },

      // --- LEVEL 2: Sub-Unit (Terkait Lembaga Pesantren) ---
      {
        id_orgunit: uuidv4(),
        nama_orgunit: 'Kesantrian & Kedisiplinan',
        parent_id: idBagianAkademik,
        level_orgunit: 2,
        id_cabang: idCabang,
        id_lembaga: idPesantren, // Menghubungkan ke Lembaga Pesantren
        jenis_orgunit: 'Sub-Unit',
        lembaga_type: 'PESANTREN',
        keterangan: 'Pengelola kedisiplinan harian santri.',
        created_at: new Date(),
        updated_at: new Date()
      },

      // --- Unit Independen: Lembaga ---
      {
        id_orgunit: uuidv4(),
        nama_orgunit: 'Lembaga Penjamin Mutu',
        parent_id: null,
        level_orgunit: 0,
        id_cabang: idCabang,
        id_lembaga: null,
        jenis_orgunit: 'Lembaga',
        lembaga_type: null,
        keterangan: 'Unit audit internal mutu organisasi.',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.bulkDelete('orgunit', {}, {});
  }
};