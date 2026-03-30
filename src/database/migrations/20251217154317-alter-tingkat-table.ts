'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc = await queryInterface.describeTable('tingkat');

    // 1. Ubah kolom tingkat
    await queryInterface.changeColumn('tingkat', 'tingkat', {
      type: DataTypes.STRING(255),
      allowNull: true,
    }, { transaction });

    // 2. Tambah kolom tingkat_type hanya jika belum ada
    if (!tableDesc.tingkat_type) {
      await queryInterface.addColumn('tingkat', 'tingkat_type', {
        allowNull: true,
        type: DataTypes.ENUM('FORMAL', 'PESANTREN'),
      }, { transaction });
    }

    // 3. Tambah constraint unik (bungkus try-catch agar tidak error jika sudah ada)
    try {
      await queryInterface.addConstraint('tingkat', {
        fields: ['tingkat', 'tingkat_type'],
        type: 'unique',
        name: 'unique_tingkat_tingkat_type',
        transaction
      });
    } catch (error) {
      console.log('Constraint unique_tingkat_tingkat_type already exists, skipping...');
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // 1. Hapus constraint dulu
    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE "tingkat" DROP CONSTRAINT IF EXISTS "unique_tingkat_tingkat_type";',
        { transaction }
      );
    } catch (e) {}

    // 2. Hapus kolom tingkat_type
    const tableDesc = await queryInterface.describeTable('tingkat');
    if (tableDesc.tingkat_type) {
      await queryInterface.removeColumn('tingkat', 'tingkat_type', { transaction });
    }

    // 3. Hapus tipe ENUM
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_tingkat_tingkat_type";',
      { transaction }
    );

    // 4. Kembalikan kolom tingkat ke semula
    await queryInterface.changeColumn('tingkat', 'tingkat', {
      type: DataTypes.STRING(255),
      allowNull: true,
      // Hati-hati: mengembalikan unique: true mungkin gagal jika ada data duplikat
    }, { transaction });
  });
};