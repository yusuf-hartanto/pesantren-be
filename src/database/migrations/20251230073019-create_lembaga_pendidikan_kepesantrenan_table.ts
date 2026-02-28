'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('lembaga_pendidikan_kepesantrenan', {
    id_lembaga: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    nama_lembaga: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    id_cabang: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'cabang', // Pastikan nama tabel cabang di DB sudah sesuai
        key: 'id_cabang',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Kolom Otomatis:
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Menangani default CURRENT_TIMESTAMP
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true, // Harus allow null agar data aktif tetap tampil
    },
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('lembaga_pendidikan_kepesantrenan');
};