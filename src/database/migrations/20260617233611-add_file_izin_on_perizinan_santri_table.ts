'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc: any = await queryInterface.describeTable('perizinan_santri');

    if (!tableDesc.file_izin) {
      await queryInterface.addColumn(
        'perizinan_santri',
        'file_izin',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction }
      );
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc: any = await queryInterface.describeTable('perizinan_santri');
    const columnsToRemove = ['file_izin'];

    for (const columnName of columnsToRemove) {
      if (tableDesc[columnName]) {
        await queryInterface.removeColumn('perizinan_santri', columnName, {
          transaction,
        });
      }
    }
  });
};
