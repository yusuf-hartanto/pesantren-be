'use strict';

import { QueryInterface, Sequelize, QueryTypes } from 'sequelize';

interface Cabang {
  id_cabang: string;
  nama_cabang: string;
  keterangan: string;
}

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    //  Ambil data id_cabang, nama_cabang, dan keterangan dari tabel cabang
    const cabangList = await queryInterface.sequelize.query<Cabang>(
      `SELECT id_cabang, nama_cabang, keterangan FROM cabang 
       WHERE nama_cabang IN ('Kantor Pusat Jakarta', 'Cabang Bandung')`,
      { type: QueryTypes.SELECT }
    );

    // Antisipasi jika data cabang belum di-seed / tidak ditemukan
    if (!cabangList || cabangList.length === 0) {
      console.warn(
        'Gagal memuat data cabang. Pastikan seeder cabang sudah dijalankan.'
      );
      return;
    }

    //  Mapping hasil query cabang ke dalam struktur tabel institution
    const institutions = cabangList.map((cabang) => ({
      id_institution: cabang.id_cabang, // Diambil dari query
      institution_name: cabang.nama_cabang, // Diambil dari query
      status: 1,
      keterangan: cabang.keterangan, // Diambil dari query
      created_at: new Date(),
      updated_at: new Date(),
    }));

    return queryInterface.bulkInsert('institution', institutions);
  },

  down: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    // Ambil ID yang mau dihapus berdasarkan nama cabang yang berelasi
    const cabangList = await queryInterface.sequelize.query<Cabang>(
      `SELECT id_cabang FROM cabang 
       WHERE nama_cabang IN ('Kantor Pusat Jakarta', 'Cabang Bandung')`,
      { type: QueryTypes.SELECT }
    );

    if (cabangList && cabangList.length > 0) {
      const idsToDelete = cabangList.map((c) => c.id_cabang);

      return queryInterface.bulkDelete('institution', {
        id_institution: idsToDelete,
      });
    }
  },
};
