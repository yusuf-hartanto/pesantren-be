'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Ambil deskripsi tabel untuk pengecekan keberadaan kolom
    const tableDesc = await queryInterface.describeTable('tahun_ajaran');

    // 2. Ubah kolom keterangan menjadi TEXT
    await queryInterface.changeColumn('tahun_ajaran', 'keterangan', {
      type: DataTypes.TEXT,
      allowNull: true,
    }, { transaction });

    // 3. Ubah kolom status menjadi ENUM
    await queryInterface.changeColumn('tahun_ajaran', 'status', {
      type: DataTypes.ENUM('Aktif', 'Nonaktif', 'Arsip'),
      allowNull: true,
    }, { transaction });

    // 4. Tambahkan kolom created_at jika belum ada
    if (!tableDesc.created_at) {
      await queryInterface.addColumn('tahun_ajaran', 'created_at', {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      }, { transaction });
    }

    // 5. Tambahkan kolom updated_at jika belum ada
    if (!tableDesc.updated_at) {
      await queryInterface.addColumn('tahun_ajaran', 'updated_at', {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      }, { transaction });
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc = await queryInterface.describeTable('tahun_ajaran');

    // 1. Hapus kolom timestamps jika ada
    if (tableDesc.created_at) {
      await queryInterface.removeColumn('tahun_ajaran', 'created_at', { transaction });
    }
    if (tableDesc.updated_at) {
      await queryInterface.removeColumn('tahun_ajaran', 'updated_at', { transaction });
    }

    // 2. Kembalikan kolom keterangan & status ke STRING
    await queryInterface.changeColumn('tahun_ajaran', 'keterangan', {
      type: DataTypes.STRING(255),
      allowNull: true,
    }, { transaction });

    await queryInterface.changeColumn('tahun_ajaran', 'status', {
      type: DataTypes.STRING(255),
      allowNull: true,
    }, { transaction });

    // 3. Hapus tipe ENUM PostgreSQL agar bersih
    try {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_tahun_ajaran_status";',
        { transaction }
      );
    } catch (e) {
      // Abaikan jika sudah terhapus
    }
  });
};