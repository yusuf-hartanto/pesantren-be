'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    const tableDefinition = await queryInterface.describeTable('cabang');

    // 1. Tambah kolom baru jika belum ada
    const newColumns = {
      province_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: { model: 'area_provinces', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      city_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: { model: 'area_regencies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      district_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: { model: 'area_districts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      sub_district_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: { model: 'area_sub_districts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      contact: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
    };

    for (const [colName, config] of Object.entries(newColumns)) {
      if (!tableDefinition[colName]) {
        await queryInterface.addColumn('cabang', colName, config);
      }
    }

    // 2. Hapus kolom jika masih ada
    if (tableDefinition['nomor_urut']) {
      await queryInterface.removeColumn('cabang', 'nomor_urut');
    }
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    const tableDefinition = await queryInterface.describeTable('cabang');
    
    const columnsToRemove = ['province_id', 'city_id', 'district_id', 'sub_district_id', 'contact', 'email'];

    for (const colName of columnsToRemove) {
      if (tableDefinition[colName]) {
        await queryInterface.removeColumn('cabang', colName);
      }
    }

    if (!tableDefinition['nomor_urut']) {
      await queryInterface.addColumn('cabang', 'nomor_urut', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }
  },
};