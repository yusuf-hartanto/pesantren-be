'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  // Gunakan Transaction agar jika gagal, tabel tidak nanggung (setengah jadi)
  return queryInterface.sequelize.transaction(async (transaction) => {
    
    await queryInterface.createTable('kamar', {
      id_kamar: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_asrama: {
        type: DataTypes.STRING,
        allowNull: true, // Diubah ke true agar sesuai dengan onDelete: 'SET NULL'
        references: {
          model: 'asrama',
          key: 'id_asrama',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      nama_kamar: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      lantai: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      kapasitas: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      id_wali_asuh: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'pegawai',
          key: 'id_pegawai',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: DataTypes.ENUM('Aktif', 'Non-Aktif'),
        allowNull: true,
      },
      keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // JANGAN pakai Raw SQL ALTER TABLE, langsung masukkan di sini:
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
    }, { transaction });
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.dropTable('kamar', { transaction });
    
    // Khusus Postgres: Hapus type ENUM agar tidak error saat migrate up lagi
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_kamar_status";',
      { transaction }
    );
  });
};