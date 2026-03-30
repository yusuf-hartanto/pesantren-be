'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    // Gunakan casting 'any' pada tableDesc agar akses properti dinamis diizinkan
    const tableDesc: any = await queryInterface.describeTable('jenis_guru');

    if (!tableDesc.id_guru) {
      await queryInterface.addColumn('jenis_guru', 'id_guru', {
        type: DataTypes.STRING,
        allowNull: true,
        references: { model: 'pegawai', key: 'id_pegawai' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }, { transaction });
    }

    if (!tableDesc.id_mapel) {
      await queryInterface.addColumn('jenis_guru', 'id_mapel', {
        type: DataTypes.STRING,
        allowNull: true,
        references: { model: 'mata_pelajaran', key: 'id_mapel' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }, { transaction });
    }

    if (!tableDesc.id_tingkat) {
      await queryInterface.addColumn('jenis_guru', 'id_tingkat', {
        type: DataTypes.STRING,
        allowNull: true,
        references: { model: 'tingkat', key: 'id_tingkat' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }, { transaction });
    }

    if (!tableDesc.id_lembaga) {
      await queryInterface.addColumn('jenis_guru', 'id_lembaga', {
        type: DataTypes.STRING,
        allowNull: true,
      }, { transaction });
    }

    if (!tableDesc.lembaga_type) {
      await queryInterface.addColumn('jenis_guru', 'lembaga_type', {
        type: DataTypes.STRING,
        allowNull: true,
      }, { transaction });
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc: any = await queryInterface.describeTable('jenis_guru');
    const columnsToRemove = ['id_guru', 'id_mapel', 'id_tingkat', 'id_lembaga', 'lembaga_type'];

    for (const columnName of columnsToRemove) {
      // Cek apakah kolom benar-benar ada di deskripsi tabel
      if (tableDesc[columnName]) {
        await queryInterface.removeColumn('jenis_guru', columnName, { transaction });
      }
    }
  });
};