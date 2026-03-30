'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Ambil deskripsi tabel untuk cek keberadaan kolom
    const tableDesc = await queryInterface.describeTable('kelompok_pelajaran');

    // 2. Tambahkan kolom parent_id hanya jika belum ada
    if (!tableDesc.parent_id) {
      await queryInterface.addColumn('kelompok_pelajaran', 'parent_id', {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'kelompok_pelajaran',
          key: 'id_kelpelajaran',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }, { transaction });
    }

    // 3. Tambahkan index (Gunakan try-catch atau cek index manual)
    try {
      await queryInterface.addIndex('kelompok_pelajaran', ['parent_id'], {
        name: 'idx_kelompok_pelajaran_parent_id',
        transaction
      });
    } catch (error) {
      console.log('Index idx_kelompok_pelajaran_parent_id already exists, skipping...');
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc = await queryInterface.describeTable('kelompok_pelajaran');

    // 1. Hapus index terlebih dahulu
    try {
      await queryInterface.removeIndex(
        'kelompok_pelajaran',
        'idx_kelompok_pelajaran_parent_id',
        { transaction }
      );
    } catch (error) {
      console.log('Index not found, skipping removal...');
    }

    // 2. Hapus kolom jika ada
    if (tableDesc.parent_id) {
      await queryInterface.removeColumn('kelompok_pelajaran', 'parent_id', { transaction });
    }
  });
};