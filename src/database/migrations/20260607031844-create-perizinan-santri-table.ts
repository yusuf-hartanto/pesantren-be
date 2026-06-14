'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('perizinan_santri', {
    id_izin: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    id_santri: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'santri',
        key: 'id_santri',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    id_lokasi_kamar: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'lokasi',
        key: 'id_lokasi',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    sumber_pengajuan: {
      type: DataTypes.ENUM('Waliasuh', 'Orang Tua', 'Kesehatan'),
      allowNull: false,
    },
    jenis_izin: {
      type: DataTypes.ENUM('Izin', 'Sakit'),
      allowNull: false,
    },
    tanggal_pengajuan: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    tanggal_mulai: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    tanggal_selesai: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    alasan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status_approval: {
      type: DataTypes.ENUM('Menunggu', 'Disetujui', 'Ditolak'),
      allowNull: false,
      defaultValue: 'Menunggu',
    },
    kondisi: {
      type: DataTypes.STRING,
      // allowNull: false,
    },
    id_approver: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'app_resource',
        key: 'resource_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    tanggal_approval: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    catatan_approval: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_canceled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_request_canceled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    request_canceled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    request_canceled_catatan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    canceled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    canceled_by: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'app_resource',
        key: 'resource_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    alasan_penutupan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // --- TAMBAHAN KOLOM AUDIT TRACKING ---
    created_by: {
      type: DataTypes.STRING,
      allowNull: false, // Diset false agar wajib diisi saat insert data baru
      references: {
        model: 'app_resource',
        key: 'resource_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    // -------------------------------------
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
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('perizinan_santri');
};
