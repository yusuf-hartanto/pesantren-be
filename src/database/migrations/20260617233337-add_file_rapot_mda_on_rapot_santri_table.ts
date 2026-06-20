'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc: any = await queryInterface.describeTable('rapot_santri');

    if (!tableDesc.file_rapot_mda) {
      await queryInterface.addColumn(
        'rapot_santri',
        'file_rapot_mda',
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
    const tableDesc: any = await queryInterface.describeTable('rapot_santri');
    const columnsToRemove = ['file_rapot_mda'];

    for (const columnName of columnsToRemove) {
      if (tableDesc[columnName]) {
        await queryInterface.removeColumn('rapot_santri', columnName, {
          transaction,
        });
      }
    }
  });
};
