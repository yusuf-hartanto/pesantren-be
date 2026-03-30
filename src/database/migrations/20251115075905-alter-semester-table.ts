'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Cek struktur tabel saat ini untuk menghindari error "already exists"
    const tableDesc = await queryInterface.describeTable('semester');

    // 2. Ubah kolom keterangan menjadi TEXT
    await queryInterface.changeColumn('semester', 'keterangan', {
      type: DataTypes.TEXT,
      allowNull: true,
    }, { transaction });

    // 3. Ubah kolom status menjadi ENUM
    await queryInterface.changeColumn('semester', 'status', {
      type: DataTypes.ENUM('Aktif', 'Nonaktif', 'Arsip'),
      allowNull: true,
    }, { transaction });

    // 4. Tambahkan kolom created_at jika belum ada
    if (!tableDesc.created_at) {
      await queryInterface.addColumn('semester', 'created_at', {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      }, { transaction });
    }

    // 5. Tambahkan kolom updated_at jika belum ada
    if (!tableDesc.updated_at) {
      await queryInterface.addColumn('semester', 'updated_at', {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      }, { transaction });
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc = await queryInterface.describeTable('semester');

    // 1. Hapus kolom timestamps jika ada
    if (tableDesc.created_at) {
      await queryInterface.removeColumn('semester', 'created_at', { transaction });
    }
    if (tableDesc.updated_at) {
      await queryInterface.removeColumn('semester', 'updated_at', { transaction });
    }

    // 2. Kembalikan kolom keterangan & status ke STRING
    await queryInterface.changeColumn('semester', 'keterangan', {
      type: DataTypes.STRING(255),
      allowNull: true,
    }, { transaction });

    await queryInterface.changeColumn('semester', 'status', {
      type: DataTypes.STRING(255),
      allowNull: true,
    }, { transaction });

    // 3. Hapus tipe ENUM PostgreSQL agar tidak mengotori database
    try {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_semester_status";',
        { transaction }
      );
    } catch (e) {
      // Abaikan jika tipe tidak ditemukan
    }
  });
};