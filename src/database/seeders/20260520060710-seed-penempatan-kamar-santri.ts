'use strict';

import { QueryInterface, Sequelize, QueryTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface DynamicRow {
  [key: string]: any;
}

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    // 1. Ambil data ID dari tabel-tabel relasi
    // Di-LIMIT 10 agar cukup didistribusikan (3 kamar x 3 santri = 9 santri)
    const santriList = await queryInterface.sequelize.query<DynamicRow>(
      `SELECT id_santri FROM santri LIMIT 10`,
      { type: QueryTypes.SELECT }
    );

    // Ambil maksimal 3 kamar
    const lokasiKamarList = await queryInterface.sequelize.query<DynamicRow>(
      `SELECT id_lokasi FROM lokasi 
       WHERE jenis_lokasi = 'Kamar' 
       LIMIT 3`,
      { type: QueryTypes.SELECT }
    );

    const tahunAjaranList = await queryInterface.sequelize.query<DynamicRow>(
      `SELECT id_tahunajaran FROM tahun_ajaran LIMIT 1`,
      { type: QueryTypes.SELECT }
    );

    // Validasi ketersediaan data master
    if (
      !santriList.length ||
      !lokasiKamarList.length ||
      !tahunAjaranList.length
    ) {
      console.warn(
        '⚠️ Gagal memuat seeder. Pastikan data master santri, tahun_ajaran, dan lokasi (Kamar) sudah terisi.'
      );
      return;
    }

    const penempatanData: any[] = [];
    let santriIndex = 0;

    // 2. Lakukan looping untuk mendistribusikan 3 santri ke setiap kamar yang tersedia
    for (const kamar of lokasiKamarList) {
      for (let i = 0; i < 3; i++) {
        // Jika stok santri di database habis sebelum loop selesai, hentikan pengisian
        if (!santriList[santriIndex]) break;

        penempatanData.push({
          id_penempatan: uuidv4(),
          id_santri: santriList[santriIndex].id_santri,
          id_lokasi: kamar.id_lokasi, // Mengubah id_asrama menjadi id_lokasi
          id_tahunajaran: tahunAjaranList[0].id_tahunajaran,
          tanggal_masuk: '2025-07-15',
          tanggal_keluar: null,
          status: 'Aktif',
          keterangan: `Santri Kamar Penghuni ke-${i + 1}`,
          created_at: new Date(),
          updated_at: new Date(),
        });

        santriIndex++; // Lanjut ke santri berikutnya
      }
    }

    if (penempatanData.length > 0) {
      return queryInterface.bulkInsert(
        'penempatan_kamar_santri',
        penempatanData
      );
    } else {
      console.warn(
        '⚠️ Tidak ada data penempatan yang berhasil dibuat. Periksa kembali jumlah baris pada tabel santri.'
      );
    }
  },

  down: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    return queryInterface.bulkDelete('penempatan_kamar_santri', {});
  },
};
