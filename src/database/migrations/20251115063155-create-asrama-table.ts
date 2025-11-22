'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('asrama', {
    id_asrama: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    id_cabang: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'cabang',
        key: 'id_cabang',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    nama_asrama: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    jumlah_kamar: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    keterangan: {
      type: DataTypes.STRING(255),
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
  await queryInterface.dropTable('asrama');
};
