'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('mata_pelajaran', {
    id_mapel: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    id_kelpelajaran: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'kelompok_pelajaran',
        key: 'id_kelpelajaran',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    id_lembaga: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    kode_mapel: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    nama_mapel: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    nomor_urut: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
    },
    kkm: {
      type: DataTypes.DECIMAL(19, 1),
      allowNull: true,
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
  await queryInterface.dropTable('mata_pelajaran');
};
