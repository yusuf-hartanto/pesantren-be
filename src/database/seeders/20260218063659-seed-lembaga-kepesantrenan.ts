'use strict';

import { QueryInterface, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface: QueryInterface, sequelize: Sequelize) {
    // Ambil minimal satu ID Cabang agar data valid (Referential Integrity)
    const [cabangs]: any = await queryInterface.sequelize.query(
      'SELECT id_cabang FROM cabang LIMIT 1'
    );

    // Jika belum ada cabang, buat ID dummy (pastikan cabang sudah ada di DB sebelumnya)
    const idCabang = cabangs.length > 0 ? cabangs[0].id_cabang : uuidv4();

    return queryInterface.bulkInsert('lembaga_pendidikan_kepesantrenan', [
      {
        id_lembaga: uuidv4(),
        nama_lembaga: 'Madrasah Tsanawiyah (MTs) Al-Hidayah',
        id_cabang: idCabang,
        keterangan: 'Lembaga pendidikan formal tingkat menengah pertama.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id_lembaga: uuidv4(),
        nama_lembaga: 'Madrasah Aliyah (MA) Al-Hidayah',
        id_cabang: idCabang,
        keterangan: 'Lembaga pendidikan formal tingkat menengah atas.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id_lembaga: uuidv4(),
        nama_lembaga: "Tahfidz Al-Qur'an Putra",
        id_cabang: idCabang,
        keterangan: "Program khusus penghafal Al-Qur'an untuk santri putra.",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id_lembaga: uuidv4(),
        nama_lembaga: 'Lembaga Bahasa Madani',
        id_cabang: idCabang,
        keterangan: 'Pusat pengembangan bahasa Arab dan Inggris.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.bulkDelete(
      'lembaga_pendidikan_kepesantrenan',
      {},
      {}
    );
  },
};
