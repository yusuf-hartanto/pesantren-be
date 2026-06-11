'use strict';

import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface: QueryInterface) {
    // 1. Ambil 5 data perizinan santri terdahulu untuk dipetakan ke log gate
    const [perizinans]: any = await queryInterface.sequelize.query(
      'SELECT id_izin, status_approval FROM perizinan_santri WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 5'
    );

    if (perizinans.length === 0) {
      console.error('Gagal Seeder Gate: Tabel perizinan_santri kosong atau data master belum siap.');
      return;
    }

    // 2. Ambil resource_id dari app_resource yang valid sebagai petugas pos jaga / kedisiplinan
    const [petugass]: any = await queryInterface.sequelize.query(`
      SELECT ar.resource_id 
      FROM app_resource ar
      INNER JOIN app_role role ON ar.role_id = role.role_id
      WHERE role.role_name IN ('petugas_kedisiplinan', 'pegawai')
      LIMIT 2
    `);

    // Fallback ID jika data tabel app_resource kosong saat pengujian lokal isolation
    const petugasKeluarId = petugass.length > 0 ? petugass[0].resource_id : uuidv4();
    const petugasMasukId = petugass.length > 1 ? petugass[1].resource_id : petugasKeluarId;

    const logSeeds: any[] = [];

    // Pemetaan variasi log gate logis dari data perizinan yang ada
    perizinans.forEach((izin: any, index: number) => {
      
      // Kasus 1: Perizinan Pertama (Status Menunggu) -> Belum lewat gate, tidak dibuatkan log
      if (izin.status_approval === 'Menunggu' && index === 0) {
        return;
      }

      // Kasus 2: Perizinan Kedua -> Sudah Keluar dan Sudah Kembali
      if (index === 1) {
        logSeeds.push({
          id_gate: uuidv4(),
          id_izin: izin.id_izin,
          waktu_keluar: moment().subtract(2, 'days').hours(8).minutes(0).toDate(),
          petugas_keluar: petugasKeluarId, // Menggunakan resource_id valid
          waktu_masuk: moment().subtract(1, 'days').hours(16).minutes(30).toDate(),
          petugas_masuk: petugasMasukId,   // Menggunakan resource_id valid
          status_gate: 'Kembali',
          keterangan: 'Santri kembali tepat waktu dan sehat.',
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        });
      }

      // Kasus 3: Perizinan Ketiga (Status Ditolak) -> Tidak diizinkan keluar, lompat
      if (izin.status_approval === 'Ditolak') {
        return;
      }

      // Kasus 4: Perizinan Keempat -> Kembali Lebih Cepat
      if (index === 3) {
        logSeeds.push({
          id_gate: uuidv4(),
          id_izin: izin.id_izin,
          waktu_keluar: moment().subtract(4, 'days').hours(9).minutes(15).toDate(),
          petugas_keluar: petugasKeluarId,
          waktu_masuk: moment().subtract(2, 'days').hours(10).minutes(0).toDate(),
          petugas_masuk: petugasMasukId,
          status_gate: 'Kembali',
          keterangan: 'Santri kembali lebih cepat dari estimasi.',
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        });
      }

      // Kasus 5: Perizinan Kelima -> Masih Berstatus di Luar (waktu_masuk & petugas_masuk NULL)
      if (index === 4) {
        logSeeds.push({
          id_gate: uuidv4(),
          id_izin: izin.id_izin,
          waktu_keluar: moment().subtract(2, 'hours').toDate(),
          petugas_keluar: petugasKeluarId,
          waktu_masuk: null,
          petugas_masuk: null,
          status_gate: 'Keluar',
          keterangan: 'Santri keluar membawa surat perizinan aktif.',
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        });
      }
    });

    // Jalankan bulk insert hanya jika array penampung memiliki data seed
    if (logSeeds.length > 0) {
      return queryInterface.bulkInsert('log_gate_santri', logSeeds);
    }
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.bulkDelete('log_gate_santri', {}, {});
  },
};