'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('pegawai', {
    id_pegawai: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true
    },
    nama_lengkap: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nik: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tempat_lahir: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tanggal_lahir: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    umur: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    jenis_kelamin: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nip: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    no_hp: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    id_orgunit: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'orgunit',
        key: 'id_orgunit',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    id_jabatan: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'jabatan',
        key: 'id_jabatan',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    tmt: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    alamat: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    pendidikan: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    bidang_ilmu: {
      type: DataTypes.STRING(255),
      allowNull: false,
    }
  });

  await queryInterface.sequelize.query(`
    ALTER TABLE pegawai 
    ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('pegawai');
};
