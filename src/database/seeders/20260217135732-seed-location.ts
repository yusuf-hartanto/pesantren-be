'use strict';

import { QueryInterface, Sequelize } from "sequelize";
import { v4 as uuidv4 } from 'uuid';

// Definisikan UUID untuk Lokasi agar bisa saling merujuk (Parent-Child)
const ID_LOC_HQ = uuidv4();
const ID_LOC_ASR = uuidv4();
const ID_LOC_KMR = uuidv4();

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    
    // Ambil data cabang dari database secara dinamis berdasarkan nama yang di-seed sebelumnya
    const cabangs: any = await queryInterface.sequelize.query(
      `SELECT id_cabang, nama_cabang FROM cabang WHERE nama_cabang IN ('Kantor Pusat Jakarta', 'Cabang Bandung')`,
      { type: 'SELECT' }
    );

    // Helper untuk mencari ID berdasarkan nama
    const getCabangId = (nama: string) => {
      const found = cabangs.find((c: any) => c.nama_cabang === nama);
      return found ? found.id_cabang : null;
    };

    const idPusat = getCabangId('Kantor Pusat Jakarta');
    const idBandung = getCabangId('Cabang Bandung');

    // Definisi data lokasi menggunakan ID hasil query
    const locations = [
      {
        id_lokasi: ID_LOC_HQ,
        nama_lokasi: 'Kantor Pusat Jakarta',
        jenis_lokasi: 'Cabang',
        parent_id: null,
        id_cabang: idPusat, // Menggunakan ID dinamis
        latitude: -6.2088,
        longitude: 106.8456,
        map_zoom: 15,
        kode_lokasi: 'JKT-01',
        qr_code: 'JKT-01',
        kapasitas: 500,
        lantai: 1,
        keterangan: 'Gedung Pusat Operasional',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_lokasi: ID_LOC_ASR,
        nama_lokasi: 'Asrama Putra Blok A',
        jenis_lokasi: 'Asrama',
        parent_id: ID_LOC_HQ,
        id_cabang: idBandung, // Menggunakan ID dinamis
        latitude: -6.2089,
        longitude: 106.8457,
        map_zoom: 18,
        kode_lokasi: 'ASR-A',
        qr_code: 'ASR-A',
        kapasitas: 100,
        lantai: 1,
        keterangan: 'Asrama khusus santri putra',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_lokasi: ID_LOC_KMR,
        nama_lokasi: 'Kamar 101',
        jenis_lokasi: 'Kamar',
        parent_id: ID_LOC_ASR,
        id_cabang: idBandung, // Menggunakan ID dinamis
        latitude: null,
        longitude: null,
        map_zoom: null,
        kode_lokasi: 'KMR-101',
        qr_code: 'KMR-101',
        kapasitas: 4,
        lantai: 1,
        keterangan: 'Kamar lantai 1 nomor 101',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // Pastikan hanya memasukkan data jika ID Cabang ditemukan
    const validLocations = locations.filter(loc => loc.id_cabang !== null);

    if (validLocations.length > 0) {
      return queryInterface.bulkInsert('lokasi', validLocations);
    }
  },

  down: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    // Menghapus berdasarkan UUID lokasi yang didefinisikan di atas
    return queryInterface.bulkDelete('lokasi', {
      id_lokasi: [ID_LOC_HQ, ID_LOC_ASR, ID_LOC_KMR]
    });
  }
};