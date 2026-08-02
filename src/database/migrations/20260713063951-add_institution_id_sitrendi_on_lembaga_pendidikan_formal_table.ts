'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc: any = await queryInterface.describeTable(
      'lembaga_pendidikan_formal'
    );

    if (!tableDesc.institution_id_sitrendi) {
      await queryInterface.addColumn(
        'lembaga_pendidikan_formal',
        'institution_id_sitrendi',
        {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'institution',
            key: 'institution_id_sitrendi',
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
    const tableDesc: any = await queryInterface.describeTable(
      'lembaga_pendidikan_formal'
    );

    if (tableDesc.institution_id_sitrendi) {
      await queryInterface.removeColumn(
        'lembaga_pendidikan_formal',
        'institution_id_sitrendi',
        {
          transaction,
        }
      );
    }
  });
};
