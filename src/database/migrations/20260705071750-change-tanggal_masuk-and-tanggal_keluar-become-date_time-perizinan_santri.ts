'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.changeColumn('perizinan_santri', 'tanggal_mulai', {
    type: DataTypes.DATE,
    allowNull: false,
  });

  await queryInterface.changeColumn('perizinan_santri', 'tanggal_selesai', {
    type: DataTypes.DATE,
    allowNull: false,
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.changeColumn('perizinan_santri', 'tanggal_mulai', {
    type: DataTypes.DATEONLY,
    allowNull: false,
  });

  await queryInterface.changeColumn('perizinan_santri', 'tanggal_selesai', {
    type: DataTypes.DATEONLY,
    allowNull: false,
  });
};