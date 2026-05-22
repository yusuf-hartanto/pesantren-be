'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('jadwal_inspeksi_kebersihan', {
    id_jadwal: {
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
    id_petugas: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'pegawai',
        key: 'id_pegawai',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    kode_slot: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'master_slot_waktu',
        key: 'kode_slot',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    hari: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addConstraint('jadwal_inspeksi_kebersihan', {
    fields: ['id_cabang', 'hari', 'kode_slot'],
    type: 'unique',
    name: 'unique_jadwal_inspeksi_kebersihan_id_cabang_hari_kode_slot',
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('jadwal_inspeksi_kebersihan');

  try {
    await queryInterface.sequelize.query(
      'DROP CONSTRAINT IF EXISTS "unique_jadwal_inspeksi_kebersihan_id_cabang_hari_kode_slot";'
    );
  } catch (e) {}
};
