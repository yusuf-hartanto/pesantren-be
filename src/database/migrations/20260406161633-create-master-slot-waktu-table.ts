'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Buat tabel di dalam transaksi
    await queryInterface.createTable(
      'master_slot_waktu',
      {
        id_master_slot_waktu: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
          unique: true,
        },
        kode_slot: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        jam_mulai: {
          type: DataTypes.TIME,
          allowNull: true,
        },
        jam_selesai: {
          type: DataTypes.TIME,
          allowNull: true,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        keterangan: {
          type: DataTypes.STRING(255),
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
    await queryInterface.dropTable('master_slot_waktu', { transaction });
  });
};
