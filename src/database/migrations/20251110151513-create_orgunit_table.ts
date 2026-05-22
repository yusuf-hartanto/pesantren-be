'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('orgunit', {
    id_orgunit: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    nama_orgunit: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'orgunit',
        key: 'id_orgunit',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    level_orgunit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    id_cabang: {
      type: DataTypes.STRING,
      allowNull: true, // Diubah ke true agar fleksibel jika ada unit lintas cabang
      references: {
        model: 'cabang',
        key: 'id_cabang',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    id_lembaga: {
      type: DataTypes.STRING,
      allowNull: true, // Diubah ke true karena tidak semua unit organisasi terikat ke lembaga sekolah
    },
    jenis_orgunit: {
      // Menggunakan ENUM agar sinkron dengan model
      type: DataTypes.ENUM('Biro', 'Bagian', 'Lembaga', 'Sub-Unit', 'Umum'),
      allowNull: false,
      defaultValue: 'Umum',
    },
    lembaga_type: {
      type: DataTypes.ENUM('FORMAL', 'PESANTREN'),
      allowNull: true,
    },
    keterangan: {
      type: DataTypes.STRING(255),
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
    // Penambahan kolom soft delete
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Opsional: Jika ingin memastikan index pada pencarian hierarki
  await queryInterface.addIndex('orgunit', ['parent_id']);
  await queryInterface.addIndex('orgunit', ['id_cabang']);

  // // Tambahkan kolom created_at dan updated_at via raw SQL
  // await queryInterface.sequelize.query(`
  //   ALTER TABLE orgunit
  //   ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  //   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  // `);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('orgunit');
};
