'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  // 1. Ambil daftar semua tabel di database
  const tables = await queryInterface.showAllTables();

  // 2. Hanya rename jika tabel lama 'beasiswa_santri' masih ada
  // dan tabel baru 'jenis_beasiswa' belum ada
  if (
    tables.includes('beasiswa_santri') &&
    !tables.includes('jenis_beasiswa')
  ) {
    await queryInterface.renameTable('beasiswa_santri', 'jenis_beasiswa');
  }

  // 3. Ambil struktur tabel 'jenis_beasiswa' untuk pengecekan kolom
  const tableDesc = await queryInterface.describeTable('jenis_beasiswa');

  // 4. Rename Column hanya jika kolom lama masih ada
  if (tableDesc.id_beasiswasantri && !tableDesc.id_beasiswa) {
    await queryInterface.renameColumn(
      'jenis_beasiswa',
      'id_beasiswasantri',
      'id_beasiswa'
    );
  }

  // 5. Ubah kolom keterangan menjadi TEXT
  await queryInterface.changeColumn('jenis_beasiswa', 'keterangan', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  // 6. Ubah kolom status menjadi ENUM
  // Penting: changeColumn pada Postgres untuk ENUM bisa tricky jika type sudah ada
  await queryInterface.changeColumn('jenis_beasiswa', 'status', {
    type: DataTypes.ENUM('Aktif', 'Nonaktif'),
    allowNull: true,
  });

  // 7. Tambahkan kolom timestamps (created_at & updated_at) jika belum ada
  if (!tableDesc.created_at) {
    await queryInterface.addColumn('jenis_beasiswa', 'created_at', {
      allowNull: true,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    });
  }

  if (!tableDesc.updated_at) {
    await queryInterface.addColumn('jenis_beasiswa', 'updated_at', {
      allowNull: true,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    });
  }
};

export const down = async (queryInterface: QueryInterface) => {
  const tables = await queryInterface.showAllTables();

  if (tables.includes('jenis_beasiswa')) {
    // 1. Hapus Kolom Timestamps
    await queryInterface.removeColumn('jenis_beasiswa', 'created_at');
    await queryInterface.removeColumn('jenis_beasiswa', 'updated_at');

    // 2. Kembalikan kolom status & keterangan ke STRING
    await queryInterface.changeColumn('jenis_beasiswa', 'status', {
      type: DataTypes.STRING(255),
      allowNull: true,
    });

    await queryInterface.changeColumn('jenis_beasiswa', 'keterangan', {
      type: DataTypes.STRING(255),
      allowNull: true,
    });

    // 3. Balikkan nama kolom
    await queryInterface.renameColumn(
      'jenis_beasiswa',
      'id_beasiswa',
      'id_beasiswasantri'
    );

    // 4. Balikkan nama tabel
    await queryInterface.renameTable('jenis_beasiswa', 'beasiswa_santri');
  }

  // 5. Hapus tipe ENUM PostgreSQL agar bersih
  try {
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_jenis_beasiswa_status";'
    );
  } catch (e) {
    // Abaikan jika tipe tidak ditemukan
  }
};
