'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.createTable(
      'jenis_penilaian_bobot',
      {
        id_bobot: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true,
          unique: true,
        },
        id_penilaian: {
          type: DataTypes.STRING,
          allowNull: true, // Diubah ke true karena onDelete: 'SET NULL'
          references: {
            model: 'jenis_penilaian',
            key: 'id_penilaian',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        lembaga_type: {
          type: DataTypes.ENUM('FORMAL', 'PESANTREN'),
          allowNull: false,
        },
        id_lembaga: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        id_tingkat: {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'tingkat',
            key: 'id_tingkat',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        id_tahunajaran: {
          type: DataTypes.STRING,
          allowNull: true, // Diubah ke true karena onDelete: 'SET NULL'
          references: {
            model: 'tahun_ajaran',
            key: 'id_tahunajaran',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        bobot: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('Aktif', 'Nonaktif'),
          allowNull: false,
        },
        // Satukan created_at & updated_at di sini, hindari Raw SQL ALTER TABLE
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
        deleted_at: {
          allowNull: true,
          type: DataTypes.DATE,
        },
      },
      { transaction }
    );
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.dropTable('jenis_penilaian_bobot', { transaction });

    // Hapus tipe ENUM PostgreSQL agar tidak bentrok saat migrasi ulang
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_jenis_penilaian_bobot_lembaga_type";',
      { transaction }
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_jenis_penilaian_bobot_status";',
      { transaction }
    );
  });
};
