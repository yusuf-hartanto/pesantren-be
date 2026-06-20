'use strict';

import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface: QueryInterface) {
    const [pegawais]: any = await queryInterface.sequelize.query(
      'SELECT id_pegawai FROM pegawai LIMIT 4'
    );

    const [lokasis]: any = await queryInterface.sequelize.query(
      'SELECT id_lokasi FROM lokasi LIMIT 2'
    );

    if (pegawais.length === 0 || lokasis.length === 0) {
      console.error(
        'Gagal: Pastikan data master pada tabel "pegawai" dan "lokasi" sudah tersedia sebelum menjalankan seeder ini.'
      );
      return;
    }

    const lokasiId1 = lokasis[0].id_lokasi;
    const lokasiId2 = lokasis[1]?.id_lokasi || lokasiId1;

    // Variasi jam kerja dengan keterangan berupa string murni
    const masterVariasiJamKerja = [
      {
        waktu_mulai: '07:30:00',
        waktu_selesai: '15:30:00',
        id_lokasi: lokasiId1,
        keterangan: 'Jam masuk & pulang reguler Shift Pagi - Kantor Pusat. Toleransi 15 menit.'
      },
      {
        waktu_mulai: '08:00:00',
        waktu_selesai: '16:00:00',
        id_lokasi: lokasiId2,
        keterangan: 'Jam masuk & pulang standar reguler - Cabang A.'
      },
      {
        waktu_mulai: '08:30:00',
        waktu_selesai: '16:30:00',
        id_lokasi: lokasiId1,
        keterangan: 'Jam masuk & pulang reguler - Unit Pelayanan Publik.'
      },
      {
        waktu_mulai: '13:00:00',
        waktu_selesai: '21:00:00',
        id_lokasi: lokasiId2,
        keterangan: 'Jam masuk & pulang khusus Shift Siang / Piket Sore.'
      }
    ];

    const dataSeeder: any[] = [];

    pegawais.forEach((pegawai: any, index: number) => {
      const variasi = masterVariasiJamKerja[index];

      dataSeeder.push({
        id_jamkerja: uuidv4(),
        id_pegawai: pegawai.id_pegawai,
        id_lokasi: variasi.id_lokasi,
        waktu_mulai: variasi.waktu_mulai,
        waktu_selesai: variasi.waktu_selesai,
        keterangan: variasi.keterangan, // Langsung string murni tanpa JSON.stringify
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      });
    });

    return queryInterface.bulkInsert('jam_kerja_pegawai', dataSeeder);
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.bulkDelete('jam_kerja_pegawai', {}, {});
  },
};