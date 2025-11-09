'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('jam_pelajaran', {
    id_jampel: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    id_jenisjam: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'jenis_jam_pelajaran',
        key: 'id_jenisjam',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    id_lembaga: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nama_jampel: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    mulai: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    selesai: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    jumlah_jampel: {
      type: DataTypes.DECIMAL(19, 1),
      allowNull: true,
    },
    nomor_urut: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
    },
    keterangan: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('jam_pelajaran');
};
