'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Buat tabel di dalam transaksi
    await queryInterface.createTable('kelas_formal', {
      id_kelas: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      id_lembaga: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'lembaga_pendidikan_formal',
          key: 'id_lembaga',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
        allowNull: true,
        references: {
          model: 'tahun_ajaran',
          key: 'id_tahunajaran',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      id_wali_kelas: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'pegawai',
          key: 'id_pegawai',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      nama_kelas: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      nomor_urut: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      keterangan: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Aktif', 'Nonaktif', 'Arsip'),
        allowNull: true,
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
      archived_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      archived_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    }, { transaction });

    // 2. Tambahkan constraint unik (Juga di dalam transaksi)
    await queryInterface.addConstraint('kelas_formal', {
      fields: ['id_lembaga', 'id_tahunajaran', 'nama_kelas'],
      type: 'unique',
      name: 'unique_kelas_formal_id_lembaga_id_tahunajaran_nama_kelas',
      transaction
    });
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Hapus tabel (Constraint akan otomatis terhapus)
    await queryInterface.dropTable('kelas_formal', { transaction });
    
    // 2. Bersihkan Type ENUM khusus Postgres
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_kelas_formal_status";',
      { transaction }
    );
  });
};