'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.changeColumn('kebersihan_inspeksi', 'kode_slot', {
    type: DataTypes.STRING(255),
    allowNull: false,
  });

  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_kebersihan_inspeksi_kode_slot";'
  );
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    'CREATE TYPE "enum_kebersihan_inspeksi_kode_slot" AS ENUM(\'PAGI\', \'SIANG\', \'SORE\', \'MALAM\');'
  );

  await queryInterface.changeColumn('kebersihan_inspeksi', 'kode_slot', {
    type: DataTypes.ENUM('PAGI', 'SIANG', 'SORE', 'MALAM'),
    allowNull: false,
  });
};
