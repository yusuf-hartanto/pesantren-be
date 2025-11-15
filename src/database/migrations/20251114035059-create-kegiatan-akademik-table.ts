'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('kegiatan_akademik', {
    id_kegiatan: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
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
    id_lembaga_formal: {
      type: DataTypes.STRING,
      allowNull: true,
      // references: {
      //   model: 'lembaga_formal',
      //   key: 'id_lembaga_formal',
      // },
      // onUpdate: 'CASCADE',
      // onDelete: 'SET NULL',
    },
    id_lembaga_pesantren: {
      type: DataTypes.STRING,
      allowNull: true,
      // references: {
      //   model: 'lembaga_kepesantrenan',
      //   key: 'id_lembaga',
      // },
      // onUpdate: 'CASCADE',
      // onDelete: 'SET NULL',
    },
    id_cabang: {
      type: DataTypes.STRING,
      allowNull: true,
      // references: {
      //   model: 'cabang',
      //   key: 'id_cabang',
      // },
      // onUpdate: 'CASCADE',
      // onDelete: 'SET NULL',
    },
    nama_kegiatan: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    keterangan: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tanggal_mulai: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    tanggal_selesai: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Aktif', 'Nonaktif'),
      allowNull: true,
      defaultValue: 'Aktif',
    },
    berlaku_untuk: {
      type: DataTypes.ENUM('Semua', 'Formal', 'Pesantren', 'Asrama'),
      allowNull: true,
      defaultValue: 'Semua',
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
  await queryInterface.dropTable('kegiatan_akademik');
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_kegiatan_akademik_status";'
  );
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_kegiatan_akademik_berlaku_untuk";'
  );
};
