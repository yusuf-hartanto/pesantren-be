'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('jenis_guru', {
    id_jenisguru: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    nama_jenis_guru: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    nomor_urut: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
    },
    keterangan: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('jenis_guru');
};
