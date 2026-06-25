'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('jam_kerja_pegawai', {
    id_jamkerja: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
      allowNull: false,
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
    id_lokasi: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'lokasi',
        key: 'id_lokasi',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    waktu_mulai: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    waktu_selesai: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
  await queryInterface.dropTable('jam_kerja_pegawai');
};
