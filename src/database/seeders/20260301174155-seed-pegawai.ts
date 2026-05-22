'use strict';

import { QueryInterface, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface: QueryInterface, sequelize: Sequelize) {
    // 1. Ambil Referensi ID dari tabel terkait (Unit & Jabatan)
    const [units]: any = await queryInterface.sequelize.query(
      'SELECT id_orgunit FROM orgunit WHERE deleted_at IS NULL LIMIT 1'
    );

    const [jabatans]: any = await queryInterface.sequelize.query(
      'SELECT id_jabatan FROM jabatan WHERE deleted_at IS NULL LIMIT 1'
    );

    // 2. Ambil Referensi ID dari tabel Wilayah (Geo-Location)
    // Mengasumsikan tabel master wilayah sudah terisi
    const [provinces]: any = await queryInterface.sequelize.query(
      'SELECT id FROM area_provinces LIMIT 1'
    );
    const [cities]: any = await queryInterface.sequelize.query(
      'SELECT id FROM area_regencies LIMIT 1'
    );
    const [districts]: any = await queryInterface.sequelize.query(
      'SELECT id FROM area_districts LIMIT 1'
    );
    const [subDistricts]: any = await queryInterface.sequelize.query(
      'SELECT id FROM area_sub_districts LIMIT 1'
    );

    if (units.length === 0 || jabatans.length === 0) {
      console.error('Gagal: Tabel orgunit atau jabatan kosong.');
      return;
    }

    const targetUnitId = units[0].id_orgunit;
    const targetJabatanId = jabatans[0].id_jabatan;

    // Ambil ID wilayah jika ada, jika tidak set null
    const provinceId = provinces.length > 0 ? provinces[0].id : null;
    const cityId = cities.length > 0 ? cities[0].id : null;
    const districtId = districts.length > 0 ? districts[0].id : null;
    const subDistrictId = subDistricts.length > 0 ? subDistricts[0].id : null;

    // 3. Masukkan data pegawai dummy dengan data wilayah
    return queryInterface.bulkInsert('pegawai', [
      {
        id_pegawai: uuidv4(),
        nik: '3201011234560001',
        nip: '198501012010011001',
        nama_lengkap: 'Budi Santoso, S.Kom',
        email: 'budi.santoso@email.com',
        no_hp: '081234567890',
        jenis_kelamin: 'Laki-laki',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '1985-05-15',
        umur: moment().diff(moment('1985-05-15'), 'years'),
        alamat: 'Jl. Merdeka No. 10, RT 01/RW 02',

        // Data Wilayah
        province_id: provinceId,
        city_id: cityId,
        district_id: districtId,
        sub_district_id: subDistrictId,

        pendidikan: 'S1 Teknik Informatika',
        bidang_ilmu: 'Teknologi Informasi',
        id_orgunit: targetUnitId,
        id_jabatan: targetJabatanId,
        status_pegawai: 'Aktif',
        tmt: '2010-01-01',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id_pegawai: uuidv4(),
        nik: '3201016543210002',
        nip: '199208122015022002',
        nama_lengkap: 'Siti Aminah, S.E',
        email: 'siti.aminah@email.com',
        no_hp: '085678901234',
        jenis_kelamin: 'Perempuan',
        tempat_lahir: 'Bandung',
        tanggal_lahir: '1992-08-12',
        umur: moment().diff(moment('1992-08-12'), 'years'),
        alamat: 'Griya Asri Blok C4 No. 12',

        // Data Wilayah
        province_id: provinceId,
        city_id: cityId,
        district_id: districtId,
        sub_district_id: subDistrictId,

        pendidikan: 'S1 Akuntansi',
        bidang_ilmu: 'Ekonomi',
        id_orgunit: targetUnitId,
        id_jabatan: targetJabatanId,
        status_pegawai: 'Aktif',
        tmt: '2015-02-01',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.bulkDelete('pegawai', {}, {});
  },
};
