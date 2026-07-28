'use strict';

import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { TIMEZONE } from '../../utils/constant';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface: QueryInterface) {
    const [santris]: any = await queryInterface.sequelize.query(
      'SELECT id_santri FROM santri LIMIT 2'
    );

    const [kamars]: any = await queryInterface.sequelize.query(
      "SELECT id_lokasi FROM lokasi WHERE jenis_lokasi = 'Kamar' LIMIT 2"
    );

    const [approvers]: any = await queryInterface.sequelize.query(`
      SELECT ar.resource_id 
      FROM app_resource ar
      INNER JOIN app_role role ON ar.role_id = role.role_id
      WHERE role.role_name = 'pegawai' 
      LIMIT 1
    `);

    if (santris.length === 0 || kamars.length === 0 || approvers.length === 0) {
      console.error(
        'Gagal: Pastikan data master santri, lokasi Kamar, dan app_resource ber-role pegawai sudah tersedia.'
      );
      return;
    }

    const santriId1 = santris[0].id_santri;
    const santriId2 = santris[1]?.id_santri || santriId1;

    const kamarId1 = kamars[0].id_lokasi;
    const kamarId2 = kamars[1]?.id_lokasi || kamarId1;

    const activePegawaiId = approvers[0].resource_id;

    return queryInterface.bulkInsert('perizinan_santri', [
      {
        id_izin: uuidv4(),
        id_santri: santriId1,
        id_lokasi_kamar: kamarId1,
        sumber_pengajuan: 'Orang Tua',
        jenis_izin: 'Izin',
        tanggal_pengajuan: moment().tz(TIMEZONE).subtract(1, 'days').toDate(),
        tanggal_mulai: moment().tz(TIMEZONE).add(1, 'days').format('YYYY-MM-DD'),
        tanggal_selesai: moment().tz(TIMEZONE).add(4, 'days').format('YYYY-MM-DD'),
        alasan: 'Menghadiri acara pernikahan kakak kandung di luar kota',
        status_approval: 'Menunggu',
        id_approver: null,
        tanggal_approval: null,
        catatan_approval: null,
        is_canceled: false,
        canceled_at: null,
        canceled_by: null,
        alasan_penutupan: null,
        created_by: activePegawaiId, // Mengisi log user pembuat
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id_izin: uuidv4(),
        id_santri: santriId2,
        id_lokasi_kamar: kamarId2,
        sumber_pengajuan: 'Waliasuh',
        jenis_izin: 'Sakit',
        tanggal_pengajuan: moment().tz(TIMEZONE).subtract(3, 'days').toDate(),
        tanggal_mulai: moment().tz(TIMEZONE).subtract(2, 'days').format('YYYY-MM-DD'),
        tanggal_selesai: moment().tz(TIMEZONE).add(1, 'days').format('YYYY-MM-DD'),
        alasan:
          'Santri mengalami demam tinggi berdarah dan direkomendasikan istirahat di rumah',
        status_approval: 'Disetujui',
        id_approver: activePegawaiId,
        tanggal_approval: moment().tz(TIMEZONE).subtract(2, 'days').toDate(),
        catatan_approval:
          'Disetujui, harap membawa surat keterangan dokter saat kembali ke asrama',
        is_canceled: false,
        canceled_at: null,
        canceled_by: null,
        alasan_penutupan: null,
        created_by: activePegawaiId, // Mengisi log user pembuat
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id_izin: uuidv4(),
        id_santri: santriId1,
        id_lokasi_kamar: kamarId1,
        sumber_pengajuan: 'Orang Tua',
        jenis_izin: 'Izin',
        tanggal_pengajuan: moment().tz(TIMEZONE).subtract(2, 'days').toDate(),
        tanggal_mulai: moment().tz(TIMEZONE).add(2, 'days').format('YYYY-MM-DD'),
        tanggal_selesai: moment().tz(TIMEZONE).add(3, 'days').format('YYYY-MM-DD'),
        alasan: 'Izin liburan keluarga ke luar kota di hari efektif KBM',
        status_approval: 'Ditolak',
        id_approver: activePegawaiId,
        tanggal_approval: moment().tz(TIMEZONE).subtract(1, 'days').toDate(),
        catatan_approval:
          'Mohon maaf, perizinan tidak mendesak di hari efektif sekolah tidak diperkenankan',
        is_canceled: false,
        canceled_at: null,
        canceled_by: null,
        alasan_penutupan:
          'Pengajuan tidak memenuhi syarat urgensi kepesantrenan',
        created_by: activePegawaiId, // Mengisi log user pembuat
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id_izin: uuidv4(),
        id_santri: santriId2,
        id_lokasi_kamar: kamarId2,
        sumber_pengajuan: 'Kesehatan',
        jenis_izin: 'Sakit',
        tanggal_pengajuan: moment().tz(TIMEZONE).subtract(5, 'days').toDate(),
        tanggal_mulai: moment().tz(TIMEZONE).subtract(4, 'days').format('YYYY-MM-DD'),
        tanggal_selesai: moment().tz(TIMEZONE).add(2, 'days').format('YYYY-MM-DD'),
        alasan: 'Gejala tipes ringan, perlu observasi di ruang kesehatan pusat',
        status_approval: 'Disetujui',
        id_approver: activePegawaiId,
        tanggal_approval: moment().tz(TIMEZONE).subtract(5, 'days').toDate(),
        catatan_approval: 'Ditempatkan di Poskes sampai kondisi membaik',
        is_canceled: true,
        canceled_at: moment().tz(TIMEZONE).subtract(1, 'days').toDate(),
        canceled_by: activePegawaiId,
        alasan_penutupan:
          'Santri sudah dinyatakan sembuh total oleh tim medis lebih cepat dari jadwal',
        created_by: activePegawaiId, // Mengisi log user pembuat
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id_izin: uuidv4(),
        id_santri: santriId1,
        id_lokasi_kamar: kamarId2,
        sumber_pengajuan: 'Kesehatan',
        jenis_izin: 'Izin',
        tanggal_pengajuan: moment().tz(TIMEZONE).toDate(),
        tanggal_mulai: moment().tz(TIMEZONE).format('YYYY-MM-DD'),
        tanggal_selesai: moment().tz(TIMEZONE).add(1, 'days').format('YYYY-MM-DD'),
        alasan:
          'Izin pergi ke RS Daerah untuk kontrol rutin kesehatan gigi pasca operasi',
        status_approval: 'Menunggu',
        id_approver: null,
        tanggal_approval: null,
        catatan_approval: null,
        is_canceled: false,
        canceled_at: null,
        canceled_by: null,
        alasan_penutupan: null,
        created_by: activePegawaiId, // Mengisi log user pembuat
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.bulkDelete('perizinan_santri', {}, {});
  },
};
