'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('status_awal_santri', {
    id_statawalsantri: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    kode_statawal: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    nama_statawal: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
  await queryInterface.dropTable('status_awal_santri');
};
