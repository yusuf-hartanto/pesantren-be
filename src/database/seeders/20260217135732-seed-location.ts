'use strict';

import { QueryInterface, Sequelize, QueryTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

// Definisikan UUID unik untuk setiap tingkat lokasi agar relasi Parent-Child aman
const ID_LOC_HQ = uuidv4();
const ID_LOC_ASR = uuidv4();

// Pisahkan UUID masing-masing kamar agar tidak duplikat/error primary key
const ID_LOC_KMR_A = uuidv4();
const ID_LOC_KMR_B = uuidv4();
const ID_LOC_KMR_C = uuidv4();

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    // Ambil data cabang dari database secara dinamis
    const cabangs: any = await queryInterface.sequelize.query(
      `SELECT id_cabang, nama_cabang FROM cabang WHERE nama_cabang IN ('Kantor Pusat Jakarta', 'Cabang Bandung')`,
      { type: QueryTypes.SELECT }
    );

    // Helper untuk mencari ID berdasarkan nama
    const getCabangId = (nama: string) => {
      const found = cabangs.find((c: any) => c.nama_cabang === nama);
      return found ? found.id_cabang : null;
    };

    const idPusat = getCabangId('Kantor Pusat Jakarta');
    const idBandung = getCabangId('Cabang Bandung');

    // Definisi data lokasi
    const locations = [
      {
        id_lokasi: ID_LOC_HQ,
        nama_lokasi: 'Kantor Pusat Jakarta',
        jenis_lokasi: 'Cabang',
        parent_id: null,
        id_cabang: idPusat,
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
        id_cabang: idBandung,
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
        id_lokasi: ID_LOC_KMR_A,
        nama_lokasi: 'Kamar A',
        jenis_lokasi: 'Kamar',
        parent_id: ID_LOC_ASR,
        id_cabang: idBandung,
        latitude: null,
        longitude: null,
        map_zoom: null,
        kode_lokasi: 'KMR-101', // Kode unik unik kamar A
        qr_code: 'KMR-101',
        kapasitas: 4,
        lantai: 1,
        keterangan: 'Kamar lantai 1A',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_lokasi: ID_LOC_KMR_B,
        nama_lokasi: 'Kamar B',
        jenis_lokasi: 'Kamar',
        parent_id: ID_LOC_ASR,
        id_cabang: idBandung,
        latitude: null,
        longitude: null,
        map_zoom: null,
        kode_lokasi: 'KMR-102', // Dibedakan agar tidak melanggar Unique Constraint
        qr_code: 'KMR-102',
        kapasitas: 4,
        lantai: 1,
        keterangan: 'Kamar lantai 1B',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_lokasi: ID_LOC_KMR_C,
        nama_lokasi: 'Kamar C',
        jenis_lokasi: 'Kamar',
        parent_id: ID_LOC_ASR,
        id_cabang: idBandung,
        latitude: null,
        longitude: null,
        map_zoom: null,
        kode_lokasi: 'KMR-103', // Dibedakan agar tidak melanggar Unique Constraint
        qr_code: 'KMR-103',
        kapasitas: 4,
        lantai: 1,
        keterangan: 'Kamar lantai 1C',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // Pastikan hanya memasukkan data jika ID Cabang ditemukan
    const validLocations = locations.filter((loc) => loc.id_cabang !== null);

    if (validLocations.length > 0) {
      // Disesuaikan dengan nama tabel di model Anda sebelumnya ('location')
      return queryInterface.bulkInsert('lokasi', validLocations);
    } else {
      console.warn(
        '⚠️ Gagal memuat seeder location. ID Cabang tidak ditemukan.'
      );
    }
  },

  down: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    // Menghapus seluruh UUID lokasi yang didefinisikan di atas secara presisi
    return queryInterface.bulkDelete('location', {
      id_lokasi: [
        ID_LOC_HQ,
        ID_LOC_ASR,
        ID_LOC_KMR_A,
        ID_LOC_KMR_B,
        ID_LOC_KMR_C,
      ],
    });
  },
};
