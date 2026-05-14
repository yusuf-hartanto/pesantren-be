'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Buat tabel di dalam transaksi
    await queryInterface.createTable(
      'shift_presensi',
      {
        id_shift: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
          unique: true,
        },
        kode_shift: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        nama_shift: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        kategori_shift: {
          type: DataTypes.ENUM('ASRAMA', 'PEGAWAI', 'SHOLAT', 'UMUM'),
          allowNull: false,
        },
        waktu_mulai: {
          type: DataTypes.TIME,
          allowNull: true,
        },
        waktu_selesai: {
          type: DataTypes.TIME,
          allowNull: true,
        },
        toleransi_menit: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        is_wajib: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        status: {
          type: DataTypes.ENUM('Aktif', 'Nonaktif'),
          allowNull: true,
        },
        keterangan: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      { transaction }
    );
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Hapus tabel
    await queryInterface.dropTable('shift_presensi', { transaction });

    // 2. Bersihkan Type ENUM (Sangat penting di Postgres)
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_shift_presensi_kategori_shift";',
      { transaction }
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_shift_presensi_status";',
      { transaction }
    );

    // Note: Drop table secara otomatis menghapus constraint yang menempel padanya
  });
};
