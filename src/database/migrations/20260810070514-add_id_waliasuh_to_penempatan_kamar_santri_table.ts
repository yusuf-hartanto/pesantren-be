'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc: any =
      await queryInterface.describeTable('penempatan_kamar_santri');

    if (!tableDesc.id_waliasuh) {
      await queryInterface.addColumn(
        'penempatan_kamar_santri',
        'id_waliasuh',
        {
          type: DataTypes.STRING,
          allowNull: true,
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction }
      );
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc: any =
      await queryInterface.describeTable('penempatan_kamar_santri');

    if (tableDesc.id_waliasuh) {
      await queryInterface.removeColumn('penempatan_kamar_santri', 'id_waliasuh', {
        transaction,
      });
    }
  });
};
