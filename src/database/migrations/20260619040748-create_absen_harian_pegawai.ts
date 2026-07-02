'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('absen_harian_pegawai', {
    id_absen: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    id_jamkerja: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'jam_kerja_pegawai',
        key: 'id_jamkerja',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    id_pegawai: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'pegawai',
        key: 'id_pegawai',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    tanggal: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    waktu_masuk: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    waktu_keluar: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    keterangan_masuk: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    keterangan_keluar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lat_masuk: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    long_masuk: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    lat_keluar: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    long_keluar: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    status_kehadiran: {
      type: DataTypes.ENUM('Hadir', 'Izin', 'Sakit', 'Alfa'),
      allowNull: false,
      defaultValue: 'Hadir',
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

  await queryInterface.addIndex(
    'absen_harian_pegawai',
    ['id_pegawai', 'tanggal', 'id_jamkerja', 'deleted_at'],
    {
      unique: true,
      name: 'unique_pegawai_tanggal_jamkerja_idx',
    }
  );
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.removeIndex(
    'absen_harian_pegawai',
    'unique_pegawai_tanggal_jamkerja_idx'
  );
  await queryInterface.dropTable('absen_harian_pegawai');
};
