'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Cek keberadaan constraint sebelum menghapus
      // PostgreSQL menyimpan constraint dalam lowercase jika tidak di-quote
      const [results]: any = await queryInterface.sequelize.query(
        `SELECT constraint_name 
         FROM information_schema.key_column_usage 
         WHERE table_name = 'orgunit' AND constraint_name = 'orgunit_id_lembaga_fkey'`,
        { transaction }
      );

      if (results.length > 0) {
        await queryInterface.removeConstraint('orgunit', 'orgunit_id_lembaga_fkey', { transaction });
      }

      // 2. Deskripsi tabel untuk cek kolom baru
      const tableDesc = await queryInterface.describeTable('orgunit');

      // 3. Jalankan perubahan satu per satu (Sequential), bukan Promise.all
      await queryInterface.changeColumn('orgunit', 'id_lembaga', {
        type: DataTypes.STRING,
        allowNull: true,
      }, { transaction });

      if (!tableDesc.lembaga_type) {
        await queryInterface.addColumn('orgunit', 'lembaga_type', {
          type: DataTypes.ENUM('FORMAL', 'PESANTREN'),
          allowNull: true,
        }, { transaction });
      }

      await queryInterface.changeColumn('orgunit', 'jenis_orgunit', {
        type: DataTypes.ENUM('Biro', 'Bagian', 'Lembaga', 'Sub-Unit', 'Umum'),
        allowNull: true,
      }, { transaction });

      await queryInterface.changeColumn('orgunit', 'keterangan', {
        type: DataTypes.TEXT,
        allowNull: true,
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableDesc = await queryInterface.describeTable('orgunit');

      if (tableDesc.lembaga_type) {
        await queryInterface.removeColumn('orgunit', 'lembaga_type', { transaction });
      }

      await queryInterface.changeColumn('orgunit', 'jenis_orgunit', {
        type: DataTypes.STRING,
        allowNull: true,
      }, { transaction });

      // Hapus type ENUM khusus Postgres
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_orgunit_jenis_orgunit";`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_orgunit_lembaga_type";`,
        { transaction }
      );

      await queryInterface.changeColumn('orgunit', 'keterangan', {
        type: DataTypes.STRING,
        allowNull: true,
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};