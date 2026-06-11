'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('surat_perizinan_santri', {
    id_surat: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    id_izin: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'perizinan_santri',
        key: 'id_izin',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    urut: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tahun: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    kode_unit: {
      type: DataTypes.STRING(50), // menggunakan varchar melalui STRING(50)
      allowNull: false,
    },
    nomor_surat: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    qrcode_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tanggal_cetak: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dicetak_oleh: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'app_resource',
        key: 'resource_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    versi_surat: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    status_surat: {
      type: DataTypes.ENUM('Aktif', 'Dicabut'),
      allowNull: false,
      defaultValue: 'Aktif',
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
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('surat_perizinan_santri');
};