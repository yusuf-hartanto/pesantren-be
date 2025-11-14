'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('program_pesantren', {
    id_program: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    nama_program: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tipe_program: {
      type: DataTypes.ENUM('Bahasa', 'Quran', 'Ibadah', 'Kepemimpinan', 'Lainnya'),
      allowNull: true,
      defaultValue: 'Lainnya',
    },
    wajib: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 0,
    },
    aktif: {
      type: DataTypes.ENUM('Ya', 'Tidak'),
      allowNull: true,
      defaultValue: 'Ya',
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('program_pesantren');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_program_pesantren_tipe_program";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_program_pesantren_aktif";');
};
