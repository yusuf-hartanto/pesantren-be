'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  // Gunakan Transaction agar jika gagal, tabel tidak "nanggung" (setengah jadi)
  return queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.createTable(
      'penempatan_kamar_santri',
      {
        id_penempatan: {
          type: DataTypes.STRING,
          primaryKey: true,
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
        id_asrama: {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'asrama',
            key: 'id_asrama',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        id_kamar: {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'kamar',
            key: 'id_kamar',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        id_tahunajaran: {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'tahun_ajaran',
            key: 'id_tahunajaran',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        tanggal_masuk: {
          type: DataTypes.DATEONLY, // DATE tanpa jam (PostgreSQL: DATE)
          allowNull: true,
        },
        tanggal_keluar: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('Aktif', 'Non-Aktif'),
          allowNull: true,
        },
        keterangan: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        created_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      { transaction }
    );
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.dropTable('penempatan_kamar_santri', { transaction });

    // Khusus Postgres: Hapus type ENUM agar tidak bentrok saat migrate up lagi
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_penempatan_kamar_santri_status";',
      { transaction }
    );
  });
};
