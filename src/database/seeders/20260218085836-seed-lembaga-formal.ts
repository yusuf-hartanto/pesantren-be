'use strict';

import { QueryInterface, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface: QueryInterface, sequelize: Sequelize) {
    // 1. Ambil minimal satu ID Cabang untuk menjaga Referential Integrity
    const [cabangs]: any = await queryInterface.sequelize.query(
      "SELECT id_cabang FROM cabang LIMIT 1"
    );

    // Pastikan ada cabang, jika tidak ada seeder akan gagal karena constraint FK
    if (cabangs.length === 0) {
      console.error('Gagal: Tabel cabang kosong. Harap isi seeder cabang terlebih dahulu.');
      return;
    }

    const idCabang = cabangs[0].id_cabang;

    return queryInterface.bulkInsert('lembaga_pendidikan_formal', [
      {
        id_lembaga: uuidv4(),
        nama_lembaga: 'SD Islam Terpadu Al-Fatih',
        id_cabang: idCabang,
        jenis_lembaga: 'SD',
        status_akreditasi: 'A',
        nomor_npsn: '10203041',
        keterangan: 'Sekolah dasar dengan fokus tahfidz dan karakter.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        id_lembaga: uuidv4(),
        nama_lembaga: 'MTs Sains Terpadu',
        id_cabang: idCabang,
        jenis_lembaga: 'MTs',
        status_akreditasi: 'A',
        nomor_npsn: '20205062',
        keterangan: 'Pendidikan menengah pertama berbasis teknologi sains.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        id_lembaga: uuidv4(),
        nama_lembaga: 'MA Keagamaan Mandiri',
        id_cabang: idCabang,
        jenis_lembaga: 'MA',
        status_akreditasi: 'B',
        nomor_npsn: '30207083',
        keterangan: 'Madrasah Aliyah dengan pendalaman kitab kuning.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        id_lembaga: uuidv4(),
        nama_lembaga: 'SMK Informatika Global',
        id_cabang: idCabang,
        jenis_lembaga: 'SMK',
        status_akreditasi: 'Belum Terakreditasi',
        nomor_npsn: '40209014',
        keterangan: 'Sekolah menengah kejuruan jurusan rekayasa perangkat lunak.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        id_lembaga: uuidv4(),
        nama_lembaga: 'STAI Al-Mansuriyah',
        id_cabang: idCabang,
        jenis_lembaga: 'Perguruan Tinggi',
        status_akreditasi: 'B',
        nomor_npsn: '50201125',
        keterangan: 'Sekolah tinggi agama Islam untuk jenjang sarjana.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      }
    ]);
  },

  async down(queryInterface: QueryInterface) {
    // Menghapus semua data dari tabel lembaga_pendidikan_formal
    return queryInterface.bulkDelete('lembaga_pendidikan_formal', {}, {});
  }
};