'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Ambil deskripsi tabel saat ini
    const tableDesc = await queryInterface.describeTable('semester');

    // 2. Ubah kolom nomor_urut
    await queryInterface.changeColumn('semester', 'nomor_urut', {
      type: DataTypes.INTEGER,
      allowNull: true,
    }, { transaction });

    // 3. Tambahkan archived_by hanya jika belum ada
    if (!tableDesc.archived_by) {
      await queryInterface.addColumn('semester', 'archived_by', {
        type: DataTypes.STRING(255),
        allowNull: true,
      }, { transaction });
    }

    // 4. Tambahkan archived_at hanya jika belum ada
    if (!tableDesc.archived_at) {
      await queryInterface.addColumn('semester', 'archived_at', {
        allowNull: true,
        type: DataTypes.DATE,
      }, { transaction });
    }

    // 5. Tambahkan constraint unik (Gunakan try-catch agar tidak error jika sudah ada)
    try {
      await queryInterface.addConstraint('semester', {
        fields: ['nama_semester', 'id_tahunajaran'],
        type: 'unique',
        name: 'unique_nama_semester_id_tahunajaran',
        transaction
      });
    } catch (error) {
      console.log('Constraint unique_nama_semester_id_tahunajaran already exists, skipping...');
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc = await queryInterface.describeTable('semester');

    // 1. Hapus constraint terlebih dahulu
    await queryInterface.sequelize.query(
      'ALTER TABLE "semester" DROP CONSTRAINT IF EXISTS "unique_nama_semester_id_tahunajaran";',
      { transaction }
    );

    // 2. Hapus kolom jika ada
    if (tableDesc.archived_by) {
      await queryInterface.removeColumn('semester', 'archived_by', { transaction });
    }
    if (tableDesc.archived_at) {
      await queryInterface.removeColumn('semester', 'archived_at', { transaction });
    }

    // 3. Kembalikan nomor_urut ke semula (Hati-hati: mengembalikan unique: true bisa gagal jika data duplikat)
    await queryInterface.changeColumn('semester', 'nomor_urut', {
      type: DataTypes.INTEGER,
      allowNull: true,
    }, { transaction });
  });
};