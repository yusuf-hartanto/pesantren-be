'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Ambil struktur tabel saat ini untuk pengecekan
    const tableDesc = await queryInterface.describeTable('status_awal_santri');

    // 2. Rename Column (Hanya jika kolom LAMA masih ada)
    if (tableDesc.id_statawalsantri) {
      await queryInterface.renameColumn(
        'status_awal_santri',
        'id_statawalsantri',
        'id_status_awal_santri',
        { transaction }
      );
    }
    if (tableDesc.kode_statawal) {
      await queryInterface.renameColumn(
        'status_awal_santri',
        'kode_statawal',
        'kode_status_awal',
        { transaction }
      );
    }
    if (tableDesc.nama_statawal) {
      await queryInterface.renameColumn(
        'status_awal_santri',
        'nama_statawal',
        'nama_status_awal',
        { transaction }
      );
    }

    // 3. Change Column (PostgreSQL otomatis menghandle jika tipe sama)
    await queryInterface.changeColumn(
      'status_awal_santri',
      'keterangan',
      {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      { transaction }
    );

    await queryInterface.changeColumn(
      'status_awal_santri',
      'status',
      {
        type: DataTypes.ENUM('Aktif', 'Nonaktif'),
        allowNull: true,
      },
      { transaction }
    );

    // 4. Add Column (Hanya jika kolom BELUM ada)
    if (!tableDesc.created_at) {
      await queryInterface.addColumn(
        'status_awal_santri',
        'created_at',
        {
          allowNull: true,
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        { transaction }
      );
    }

    if (!tableDesc.updated_at) {
      await queryInterface.addColumn(
        'status_awal_santri',
        'updated_at',
        {
          allowNull: true,
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        { transaction }
      );
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc = await queryInterface.describeTable('status_awal_santri');

    // 1. Remove Column jika ada
    if (tableDesc.created_at) {
      await queryInterface.removeColumn('status_awal_santri', 'created_at', {
        transaction,
      });
    }
    if (tableDesc.updated_at) {
      await queryInterface.removeColumn('status_awal_santri', 'updated_at', {
        transaction,
      });
    }

    // 2. Revert Change Column
    await queryInterface.changeColumn(
      'status_awal_santri',
      'keterangan',
      {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      { transaction }
    );

    await queryInterface.changeColumn(
      'status_awal_santri',
      'status',
      {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      { transaction }
    );

    // 3. Revert Rename Column (Hanya jika kolom BARU ada)
    if (tableDesc.id_status_awal_santri) {
      await queryInterface.renameColumn(
        'status_awal_santri',
        'id_status_awal_santri',
        'id_statawalsantri',
        { transaction }
      );
    }
    if (tableDesc.kode_status_awal) {
      await queryInterface.renameColumn(
        'status_awal_santri',
        'kode_status_awal',
        'kode_statawal',
        { transaction }
      );
    }
    if (tableDesc.nama_status_awal) {
      await queryInterface.renameColumn(
        'status_awal_santri',
        'nama_status_awal',
        'nama_statawal',
        { transaction }
      );
    }

    // 4. Drop Enum Type
    try {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_status_awal_santri_status";',
        { transaction }
      );
    } catch (e) {}
  });
};
