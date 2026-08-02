'use strict';

import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { TIMEZONE } from '../../utils/constant';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface: QueryInterface) {
    // Ambil semua ID dari tabel perizinan_santri yang telah kita seed sebelumnya
    const [perizinans]: any = await queryInterface.sequelize.query(
      'SELECT id_izin FROM perizinan_santri ORDER BY created_at ASC LIMIT 5'
    );

    // Catatan: Ambil kode_lokasi dari tabel lokasi dengan tipe/jenis_lokasi = 'Asrama'
    const [asramas]: any = await queryInterface.sequelize.query(
      "SELECT kode_lokasi FROM lokasi WHERE jenis_lokasi = 'Asrama'  LIMIT 1"
    );

    // Ambil resource_id pegawai untuk pengisi field dicetak_oleh
    const [pegawais]: any = await queryInterface.sequelize.query(`
      SELECT ar.resource_id 
      FROM app_resource ar
      INNER JOIN app_role role ON ar.role_id = role.role_id
      WHERE role.role_name = 'pegawai'
      LIMIT 1
    `);

    // Validasi ketersediaan data relasi
    if (perizinans.length === 0) {
      console.error('Gagal Seeder Surat: Tabel perizinan_santri kosong.');
      return;
    }

    const kodeUnitTarget =
      asramas.length > 0 ? asramas[0].kode_lokasi : 'ASM-PST';
    const pencetakResourceId =
      pegawais.length > 0 ? pegawais[0].resource_id : 'SYSTEM';
    const tahunSekarang = moment().tz(TIMEZONE).year();

    const suratSeeds = perizinans.map((perizinan: any, index: number) => {
      const nomorUrut = index + 1;
      // Format nomor surat dummy contoh: 001/ASM-PST/PERIZINAN/2026
      const stringUrut = String(nomorUrut).padStart(3, '0');
      const nomorSuratGenerated = `${stringUrut}/${kodeUnitTarget}/PERIZINAN/${tahunSekarang}`;

      // Skenario variasi: khusus data terakhir kita set sebagai 'Dicabut' (misal karena case Skenario 4/5 dibatalkan)
      const statusSurat = index === 3 ? 'Dicabut' : 'Aktif';
      const versiSurat = index === 3 ? 2 : 1;

      return {
        id_surat: uuidv4(),
        id_izin: perizinan.id_izin,
        urut: nomorUrut,
        tahun: tahunSekarang,
        kode_unit: kodeUnitTarget,
        nomor_surat: nomorSuratGenerated,
        qrcode_token: `tok_qr_${uuidv4().substring(0, 8)}_${nomorUrut}`,
        tanggal_cetak: moment().tz(TIMEZONE).subtract(index, 'hours').toDate(),
        dicetak_oleh: pencetakResourceId,
        versi_surat: versiSurat,
        status_surat: statusSurat,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };
    });

    return queryInterface.bulkInsert('surat_perizinan_santri', suratSeeds);
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.bulkDelete('surat_perizinan_santri', {}, {});
  },
};
