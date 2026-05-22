'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Buat tabel di dalam transaksi
    await queryInterface.createTable(
      'kebersihan_temuan',
      {
        id_temuan: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
          unique: true,
        },
        id_inspeksi: {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'kebersihan_inspeksi',
            key: 'id_inspeksi',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        kategori: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        deskripsi: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        tingkat: {
          type: DataTypes.SMALLINT,
          allowNull: true,
        },
        perlu_tindak_lanjut: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        foto_path: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      { transaction }
    );
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Hapus tabel
    await queryInterface.dropTable('kebersihan_temuan', { transaction });

    // Note: Drop table secara otomatis menghapus constraint yang menempel padanya
  });
};
