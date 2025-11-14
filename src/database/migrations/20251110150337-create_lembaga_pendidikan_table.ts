'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('lembaga_pendidikan', {
    id_lembaga: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true
    },
    nama_lembaga: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    nomor_urut: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_cabang: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'cabang',
        key: 'id_cabang',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    jenis_pendidikan: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    keterangan: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    alamat: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  });

  // Tambahkan kolom created_at & updated_at via raw SQL
  await queryInterface.sequelize.query(`
    ALTER TABLE lembaga_pendidikan
    ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('lembaga_pendidikan');
};
