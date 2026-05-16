'use strict';

import { QueryInterface, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export async function up(queryInterface: QueryInterface, sequelize: Sequelize) {
  // 1. Ambil data id_lokasi yang sudah ada di tabel lokasi
  // Kita lakukan query SELECT untuk mendapatkan ID yang valid
  const lokasis: any = await queryInterface.sequelize.query(
    'SELECT id_lokasi FROM lokasi LIMIT 5;',
    { type: 'SELECT' }
  );

  if (lokasis.length === 0) {
    console.log(
      'Seed ditunda: Tidak ada data di tabel lokasi untuk direferensikan.'
    );
    return;
  }

  // 2. Insert data ke geo_areas menggunakan ID dari hasil query di atas
  await queryInterface.bulkInsert('geo_areas', [
    {
      id_geo: uuidv4(),
      id_lokasi: lokasis[0].id_lokasi, // Mengambil ID lokasi pertama
      nama_area: 'Area Parkir Utama',
      tipe_geo: 'CIRCLE',
      latitude: -6.17511,
      longitude: 106.82712,
      radius_meter: 50,
      toleransi_meter: 5,
      is_active: true,
      versi: 1,
      keterangan: 'Geofence untuk area parkir kendaraan operasional',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id_geo: uuidv4(),
      id_lokasi: lokasis[1] ? lokasis[1].id_lokasi : lokasis[0].id_lokasi, // Pakai yang kedua jika ada
      nama_area: 'Zona Keamanan Gudang',
      tipe_geo: 'POLYGON',
      polygon_json: JSON.stringify([
        { lat: -6.20876, lng: 106.84559 },
        { lat: -6.20886, lng: 106.84569 },
        { lat: -6.20896, lng: 106.84559 },
      ]),
      toleransi_meter: 10,
      is_active: true,
      versi: 1,
      keterangan: 'Area poligon gudang logistik',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.bulkDelete('geo_areas', {}, {});
}
