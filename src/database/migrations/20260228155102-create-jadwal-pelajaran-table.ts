'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('jadwal_pelajaran', {
    id_jadwal: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    id_kelas: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    id_gmapel: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'jenis_guru',
        key: 'id_jenisguru',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    id_jam_pelajaran: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'jam_pelajaran',
        key: 'id_jam_pelajaran',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    id_semester: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'semester',
        key: 'id_semester',
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
    id_lokasi: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'lokasi',
        key: 'id_lokasi',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    hari: {
      type: DataTypes.ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Aktif', 'Nonaktif', 'Arsip'),
      allowNull: true,
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

  await queryInterface.addConstraint('jadwal_pelajaran', {
    fields: ['id_kelas', 'hari', 'id_jam_pelajaran'],
    type: 'unique',
    name: 'unique_jadwal_pelajaran_id_kelas_hari_id_jam_pelajaran',
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('jadwal_pelajaran');
  try {
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_jadwal_pelajaran_status";'
    );
  } catch (e) {}

  try {
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_jadwal_pelajaran_hari";'
    );
  } catch (e) {}

  try {
    await queryInterface.sequelize.query(
      'DROP CONSTRAINT IF EXISTS "unique_jadwal_pelajaran_id_kelas_hari_id_jam_pelajaran";'
    );
  } catch (e) {}
};
