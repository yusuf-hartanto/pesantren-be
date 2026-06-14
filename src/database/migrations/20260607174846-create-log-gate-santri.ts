'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('log_gate_santri', {
    id_gate: {
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
    waktu_keluar: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    petugas_keluar: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    waktu_masuk: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    petugas_masuk: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status_gate: {
      type: DataTypes.ENUM('Keluar', 'Kembali'),
      allowNull: false,
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
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
  await queryInterface.dropTable('log_gate_santri');
};
