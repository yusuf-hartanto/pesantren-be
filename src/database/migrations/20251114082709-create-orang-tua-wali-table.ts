'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('orang_tua_wali', {
    id_wali: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    id_santri: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'santri',
        key: 'id_santri',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    nama_wali: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    hubungan: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    nik: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    pendidikan: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    pekerjaan: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    no_hp: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    alamat: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('orang_tua_wali');
};
