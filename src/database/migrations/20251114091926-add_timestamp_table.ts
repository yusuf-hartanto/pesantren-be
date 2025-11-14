'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await Promise.all([
    queryInterface.addColumn('kelompok_pelajaran', 'created_at', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    }),
    queryInterface.addColumn('kelompok_pelajaran', 'updated_at', {
      type: DataTypes.DATE,
      allowNull: true,
    }),

    queryInterface.addColumn('mata_pelajaran', 'created_at', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    }),
    queryInterface.addColumn('mata_pelajaran', 'updated_at', {
      type: DataTypes.DATE,
      allowNull: true,
    }),

    queryInterface.addColumn('jenis_jam_pelajaran', 'created_at', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    }),
    queryInterface.addColumn('jenis_jam_pelajaran', 'updated_at', {
      type: DataTypes.DATE,
      allowNull: true,
    }),

    queryInterface.addColumn('jam_pelajaran', 'created_at', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    }),
    queryInterface.addColumn('jam_pelajaran', 'updated_at', {
      type: DataTypes.DATE,
      allowNull: true,
    }),

    queryInterface.addColumn('jenis_guru', 'created_at', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    }),
    queryInterface.addColumn('jenis_guru', 'updated_at', {
      type: DataTypes.DATE,
      allowNull: true,
    }),
  ]);
};

export const down = async (queryInterface: QueryInterface) => {
  await Promise.all([
    queryInterface.removeColumn('kelompok_pelajaran', 'created_at'),
    queryInterface.removeColumn('kelompok_pelajaran', 'updated_at'),

    queryInterface.removeColumn('mata_pelajaran', 'created_at'),
    queryInterface.removeColumn('mata_pelajaran', 'updated_at'),

    queryInterface.removeColumn('jenis_jam_pelajaran', 'created_at'),
    queryInterface.removeColumn('jenis_jam_pelajaran', 'updated_at'),

    queryInterface.removeColumn('jam_pelajaran', 'created_at'),
    queryInterface.removeColumn('jam_pelajaran', 'updated_at'),

    queryInterface.removeColumn('jenis_guru', 'created_at'),
    queryInterface.removeColumn('jenis_guru', 'updated_at'),
  ]);
};
