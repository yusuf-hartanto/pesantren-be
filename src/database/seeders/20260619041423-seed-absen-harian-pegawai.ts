'use strict';

import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface: QueryInterface) {
    // Ambil data dari tabel jam_kerja_pegawai yang aktif untuk dijadikan referensi
    const [jamKerjas]: any = await queryInterface.sequelize.query(
      `SELECT id_jamkerja, id_pegawai, waktu_mulai, waktu_selesai 
       FROM jam_kerja_pegawai 
       WHERE is_active = true 
       LIMIT 4`
    );

    if (jamKerjas.length === 0) {
      console.error(
        'Gagal: Pastikan data relasi pada tabel "jam_kerja_pegawai" sudah tersedia sebelum menjalankan seeder ini.'
      );
      return;
    }

    const dataSeeder: any[] = [];
    const hariIni = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

    // Variasi skenario log absensi harian
    const skenarioAbsen = [
      {
        status_kehadiran: 'Hadir',
        selisih_masuk_menit: -10, // Datang lebih awal 10 menit
        selisih_keluar_menit: 5,   // Pulang lebih lambat 5 menit
        keterangan_masuk: 'Absen masuk reguler, kondisi sehat.',
        keterangan_keluar: 'Absen pulang kerja selesai tugas harian.',
        lat: -7.556112,
        long: 110.831642
      },
      {
        status_kehadiran: 'Hadir',
        selisih_masuk_menit: 15,  // Terlambat 15 menit
        selisih_keluar_menit: 0,   // Pulang pas waktu
        keterangan_masuk: 'Terlambat karena kendala kemacetan di jalan raya.',
        keterangan_keluar: 'Absen pulang tepat waktu.',
        lat: -7.556200,
        long: 110.831700
      },
      {
        status_kehadiran: 'Sakit',
        selisih_masuk_menit: null,
        selisih_keluar_menit: null,
        keterangan_masuk: 'Surat dokter terlampir di sistem HC.',
        keterangan_keluar: null,
        lat: null,
        long: null
      },
      {
        status_kehadiran: 'Izin',
        selisih_masuk_menit: null,
        selisih_keluar_menit: null,
        keterangan_masuk: 'Izin keperluan urusan keluarga mendesak.',
        keterangan_keluar: null,
        lat: null,
        long: null
      }
    ];

    // Helper untuk memanipulasi waktu string (HH:mm:ss) digabung dengan tanggal hari ini
    const generateDateTime = (tanggalStr: string, waktuStr: string, manipulasiMenit: number | null) => {
      if (!waktuStr || manipulasiMenit === null) return null;
      const tgl = new Date(`${tanggalStr}T${waktuStr}`);
      tgl.setMinutes(tgl.getMinutes() + manipulasiMenit);
      return tgl;
    };

    jamKerjas.forEach((jk: any, index: number) => {
      // Ambil skenario berurutan atau fallback ke skenario pertama jika loop melebihi variasi
      const skenario = skenarioAbsen[index] || skenarioAbsen[0];

      const waktuMasukSimulasi = generateDateTime(hariIni, jk.waktu_mulai, skenario.selisih_masuk_menit);
      const waktuKeluarSimulasi = generateDateTime(hariIni, jk.waktu_selesai, skenario.selisih_keluar_menit);

      dataSeeder.push({
        id_absen: uuidv4(),
        id_jamkerja: jk.id_jamkerja,
        id_pegawai: jk.id_pegawai,
        tanggal: hariIni,
        waktu_masuk: waktuMasukSimulasi,
        waktu_keluar: waktuKeluarSimulasi,
        keterangan_masuk: skenario.keterangan_masuk,
        keterangan_keluar: skenario.keterangan_keluar,
        lat_masuk: skenario.lat,
        long_masuk: skenario.long,
        lat_keluar: waktuKeluarSimulasi ? skenario.lat : null,
        long_keluar: waktuKeluarSimulasi ? skenario.long : null,
        status_kehadiran: skenario.status_kehadiran,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      });
    });

    return queryInterface.bulkInsert('absen_harian_pegawai', dataSeeder);
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.bulkDelete('absen_harian_pegawai', {}, {});
  },
};