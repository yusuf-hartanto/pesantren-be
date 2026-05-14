'use strict';

import { QueryInterface, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

// Simpan UUID di luar agar bisa dipakai di up dan down
const ID_PUSAT = uuidv4();
const ID_BANDUNG = uuidv4();

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    const branches = [
      {
        id_cabang: ID_PUSAT,
        nama_cabang: 'Kantor Pusat Jakarta',
        province_id: '34',
        city_id: '34.04',
        contact: '021-1234567',
        email: 'pusat@lembaga.com',
        keterangan: 'Pusat Operasional Utama',
        alamat: 'Jl. Merdeka No. 1, Gambir',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_cabang: ID_BANDUNG,
        nama_cabang: 'Cabang Bandung',
        province_id: '34',
        city_id: '34.04',
        contact: '022-7654321',
        email: 'bandung@lembaga.com',
        keterangan: 'Kantor Wilayah Jawa Barat',
        alamat: 'Jl. Asia Afrika No. 10',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    return queryInterface.bulkInsert('cabang', branches);
  },

  down: async (queryInterface: QueryInterface, Sequelize: Sequelize) => {
    // Menghapus berdasarkan UUID yang digenerate tadi
    return queryInterface.bulkDelete('cabang', {
      id_cabang: [ID_PUSAT, ID_BANDUNG],
    });
  },
};
