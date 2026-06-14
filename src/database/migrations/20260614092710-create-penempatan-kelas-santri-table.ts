'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('penempatan_kelas_santri', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    id_santri: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'santri',
        key: 'id_santri',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    id_kelas_mda: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'kelas_mda',
        key: 'id_kelas_mda',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    id_kelas_formal: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'kelas_formal',
        key: 'id_kelas', // Note: kelas_formal table primary key is id_kelas!
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    id_tahun_ajaran: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'tahun_ajaran',
        key: 'id_tahunajaran', // Note: tahun_ajaran table primary key is id_tahunajaran!
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    tanggal_masuk: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    tanggal_keluar: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Aktif', 'Alumni', 'Tidak Aktif'),
      allowNull: false,
      defaultValue: 'Aktif',
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'app_resource',
        key: 'resource_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    updated_by: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'app_resource',
        key: 'resource_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('penempatan_kelas_santri');
};
