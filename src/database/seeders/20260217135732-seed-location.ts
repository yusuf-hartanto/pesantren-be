'use strict';

import { QueryInterface, Sequelize } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    // Definisi data dalam bentuk Array agar bersih
    const locations = [
      {
        id_lokasi: 'LOC-HQ-001',
        nama_lokasi: 'Kantor Pusat Jakarta',
        jenis_lokasi: 'Cabang',
        parent_id: null,
        id_cabang: 'CBG-JKT-001',
        latitude: -6.2088,
        longitude: 106.8456,
        map_zoom: 15,
        kode_lokasi: 'JKT-01',
        qr_code: 'QR-JKT-01',
        kapasitas: 500,
        lantai: 1,
        keterangan: 'Gedung Pusat Operasional',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_lokasi: 'LOC-ASR-001',
        nama_lokasi: 'Asrama Putra Blok A',
        jenis_lokasi: 'Asrama',
        parent_id: 'LOC-HQ-001', // Merujuk ke Kantor Pusat
        id_cabang: 'CBG-BDG-001',
        latitude: -6.2089,
        longitude: 106.8457,
        map_zoom: 18,
        kode_lokasi: 'ASR-A',
        qr_code: 'QR-ASR-A',
        kapasitas: 100,
        lantai: 1,
        keterangan: 'Asrama khusus santri putra',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_lokasi: 'LOC-KMR-101',
        nama_lokasi: 'Kamar 101',
        jenis_lokasi: 'Kamar',
        parent_id: 'LOC-ASR-001', // Merujuk ke Asrama Putra
        id_cabang: 'CBG-BDG-001',
        latitude: null,
        longitude: null,
        map_zoom: null,
        kode_lokasi: 'KMR-101',
        qr_code: 'QR-KMR-101',
        kapasitas: 4,
        lantai: 1,
        keterangan: 'Kamar lantai 1 nomor 101',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    return queryInterface.bulkInsert('lokasi', locations);
  },

  down: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    // Menghapus data berdasarkan ID yang kita buat agar tidak menghapus data asli lainnya
    return queryInterface.bulkDelete('lokasi', {
      id_lokasi: ['LOC-HQ-001', 'LOC-ASR-001', 'LOC-KMR-101']
    });
  }
};