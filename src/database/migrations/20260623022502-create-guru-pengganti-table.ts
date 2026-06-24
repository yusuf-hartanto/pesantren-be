'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Buat tabel di dalam transaksi
    await queryInterface.createTable(
      'guru_pengganti',
      {
        id_pengganti: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
          unique: true,
        },
        id_jadwal: {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'jadwal_pelajaran',
            key: 'id_jadwal',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        id_guru_asli: {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'pegawai',
            key: 'id_pegawai',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        id_guru_pengganti: {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'pegawai',
            key: 'id_pegawai',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        tanggal: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        alasan: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status_approval: {
          type: DataTypes.ENUM('Menunggu', 'Disetujui', 'Ditolak'),
          allowNull: false,
          defaultValue: 'Menunggu',
        },
        created_by: {
          type: DataTypes.STRING,
          allowNull: false, // Diset false agar wajib diisi saat insert data baru
          references: {
            model: 'app_resource',
            key: 'resource_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
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
        approved_by: {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'app_resource',
            key: 'resource_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        approved_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      { transaction }
    );
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Hapus tabel
    await queryInterface.dropTable('guru_pengganti', { transaction });

    // Note: Drop table secara otomatis menghapus constraint yang menempel padanya
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_guru_pengganti_status_approval";',
      { transaction }
    );
  });
};
