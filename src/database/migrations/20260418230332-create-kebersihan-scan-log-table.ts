'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Buat tabel di dalam transaksi
    await queryInterface.createTable(
      'kebersihan_scan_log',
      {
        id_scan_log: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
          unique: true,
        },
        id_inspeksi: {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'kebersihan_inspeksi',
            key: 'id_inspeksi',
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
        id_geo: {
          type: DataTypes.STRING,
          allowNull: true,
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
        qr_code: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        scan_latitude: {
          type: DataTypes.DECIMAL(10, 7),
          allowNull: true,
        },
        scan_longitude: {
          type: DataTypes.DECIMAL(10, 7),
          allowNull: true,
        },
        jarak_meter: {
          type: DataTypes.DECIMAL(8, 2),
          allowNull: true,
        },
        valid_qr: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        valid_geo: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        metode_scan: {
          type: DataTypes.ENUM('QR', 'GPS', 'QR+GPS', 'MANUAL'),
          allowNull: false,
        },
        scan_source: {
          type: DataTypes.ENUM('MOBILE', 'PWA', 'WEB'),
          allowNull: false,
        },
        user_agent: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        ip_address: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        scan_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        keterangan: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      { transaction }
    );
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Hapus tabel
    await queryInterface.dropTable('kebersihan_scan_log', { transaction });

    // 2. Bersihkan Type ENUM (Sangat penting di Postgres)
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_kebersihan_scan_log_metode_scan";',
      { transaction }
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_kebersihan_scan_log_scan_source";',
      { transaction }
    );

    // Note: Drop table secara otomatis menghapus constraint yang menempel padanya
  });
};
