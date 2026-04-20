'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Buat tabel di dalam transaksi
    await queryInterface.createTable('kebersihan_inspeksi', {
      id_inspeksi: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      id_cabang: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'cabang',
          key: 'id_cabang',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      id_lokasi: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'lokasi',
          key: 'id_lokasi',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      id_petugas: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'pegawai',
          key: 'id_pegawai',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      id_jadwal: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'jadwal_inspeksi_kebersihan',
          key: 'id_jadwal',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tanggal: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      waktu: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      kode_slot: {
        type: DataTypes.ENUM('PAGI', 'SIANG', 'SORE', 'MALAM'),
        allowNull: false,
      },
      status_kondisi: {
        type: DataTypes.ENUM('BERSIH', 'KOTOR'),
        allowNull: true,
      },
      catatan_umum: {
        type: DataTypes.TEXT,
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
    }, { transaction });

  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Hapus tabel
    await queryInterface.dropTable('kebersihan_inspeksi', { transaction });

    // 2. Bersihkan Type ENUM (Sangat penting di Postgres)
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_kebersihan_inspeksi_kode_slot";',
      { transaction }
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_kebersihan_inspeksi_status_kondisi";',
      { transaction }
    );

    // Note: Drop table secara otomatis menghapus constraint yang menempel padanya
  });
};