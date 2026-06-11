'use strict';

import { QueryInterface, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    return queryInterface.bulkInsert('shift_presensi', [
      {
        id_shift: uuidv4(),
        kode_shift: 'ASM-TAHFIDZ-SUBUH',
        nama_shift: 'Ziyadah & Murajaah Tahfidz Subuh',
        kategori_shift: 'ASRAMA',
        waktu_mulai: '05:00:00',
        waktu_selesai: '06:30:00',
        toleransi_menit: 10,
        is_wajib: true,
        status: 'Aktif',
        keterangan: 'Setoran hafalan baru dan pengulangan setelah sholat subuh',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_shift: uuidv4(),
        kode_shift: 'ASM-KITAB-KUNING',
        nama_shift: 'Pembahasan Kitab Turats (Kuning)',
        kategori_shift: 'ASRAMA',
        waktu_mulai: '16:00:00',
        waktu_selesai: '17:15:00',
        toleransi_menit: 15,
        is_wajib: true,
        status: 'Aktif',
        keterangan: 'Kajian kitab fikih dan akhlak bakda ashar',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_shift: uuidv4(),
        kode_shift: 'ASM-KAJIAN-MAGHRIB',
        nama_shift: 'Kajian Tematik & Muhadharah',
        kategori_shift: 'SHOLAT',
        waktu_mulai: '18:30:00',
        waktu_selesai: '19:15:00',
        toleransi_menit: 5,
        is_wajib: true,
        status: 'Aktif',
        keterangan: 'Kajian kontemporer di jeda waktu Maghrib ke Isya',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_shift: uuidv4(),
        kode_shift: 'ASM-MUWAIJAH-MALAM',
        nama_shift: 'Muajahah (Belajar Mandiri Terbimbing)',
        kategori_shift: 'ASRAMA',
        waktu_mulai: '20:00:00',
        waktu_selesai: '21:30:00',
        toleransi_menit: 15,
        is_wajib: true,
        status: 'Aktif',
        keterangan:
          'Sesi mengulang pelajaran sekolah/kuliah didampingi musyrif',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_shift: uuidv4(),
        kode_shift: 'ASM-QURAN-MALAM',
        nama_shift: 'Tahsin Al-Quran Eksekutif',
        kategori_shift: 'UMUM',
        waktu_mulai: '20:00:00',
        waktu_selesai: '21:30:00',
        toleransi_menit: 20,
        is_wajib: false,
        status: 'Aktif',
        keterangan:
          'Program perbaikan bacaan Quran terbuka untuk santri umum/non-reguler',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    return queryInterface.bulkDelete('shift_presensi', {
      kode_shift: [
        'ASM-TAHFIDZ-SUBUH',
        'ASM-KITAB-KUNING',
        'ASM-KAJIAN-MAGHRIB',
        'ASM-MUWAIJAH-MALAM',
        'ASM-QURAN-MALAM',
      ],
    });
  },
};
