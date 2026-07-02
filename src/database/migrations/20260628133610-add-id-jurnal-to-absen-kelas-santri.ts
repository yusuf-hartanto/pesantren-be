'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc: any =
      await queryInterface.describeTable('absen_kelas_santri');

    if (!tableDesc.id_jurnal) {
      await queryInterface.addColumn(
        'absen_kelas_santri',
        'id_jurnal',
        {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'jurnal_kelas',
            key: 'id_jurnal',
          },
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
      await queryInterface.describeTable('absen_kelas_santri');

    if (tableDesc.id_jurnal) {
      await queryInterface.removeColumn('absen_kelas_santri', 'id_jurnal', {
        transaction,
      });
    }
  });
};
