'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('absen_harian_santri', {
    id_absen: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    id_santri: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    id_lokasi_kamar: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    id_shift_presensi: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tanggal: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    waktu_absen: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    status_kehadiran: {
      type: DataTypes.ENUM('Hadir', 'Izin', 'Sakit', 'Alfa'),
      allowNull: false,
      defaultValue: 'Hadir',
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    id_petugas: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date(),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date(),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Membuat Unique Index Gabungan
  await queryInterface.addIndex('absen_harian_santri', {
    fields: ['id_santri', 'tanggal', 'id_shift_presensi'],
    unique: true,
    name: 'unique_absen_santri_shift_per_hari',
    where: {
      is_deleted: false,
      deleted_at: null,
    },
  });
};

export const down = async (queryInterface: QueryInterface) => {
  // Hapus unique index terlebih dahulu
  await queryInterface.removeIndex(
    'absen_harian_santri',
    'unique_absen_santri_shift_per_hari'
  );

  // Hapus tabel utama
  await queryInterface.dropTable('absen_harian_santri');

  // Perbaikan pemanggilan dialect menggunakan getDialect()
  if (queryInterface.sequelize.getDialect() === 'postgres') {
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_absen_harian_santri_status_kehadiran";'
    );
  }
};
