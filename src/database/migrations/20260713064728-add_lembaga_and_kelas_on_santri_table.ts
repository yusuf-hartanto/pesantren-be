'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc: any = await queryInterface.describeTable('santri');

    if (!tableDesc.id_lembaga_formal) {
      await queryInterface.addColumn(
        'santri',
        'id_lembaga_formal',
        {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'lembaga_pendidikan_formal',
            key: 'id_lembaga',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction }
      );
    }

    if (!tableDesc.id_lembaga_mda) {
      await queryInterface.addColumn(
        'santri',
        'id_lembaga_mda',
        {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'lembaga_pendidikan_kepesantrenan',
            key: 'id_lembaga',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction }
      );
    }

    if (!tableDesc.id_kelas_formal) {
      await queryInterface.addColumn(
        'santri',
        'id_kelas_formal',
        {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'kelas_formal',
            key: 'id_kelas',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction }
      );
    }

    if (!tableDesc.id_kelas_mda) {
      await queryInterface.addColumn(
        'santri',
        'id_kelas_mda',
        {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'kelas_mda',
            key: 'id_kelas_mda',
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
    const tableDesc: any = await queryInterface.describeTable('santri');

    if (tableDesc.id_lembaga_formal) {
      await queryInterface.removeColumn('santri', 'id_lembaga_formal', {
        transaction,
      });
    }

    if (tableDesc.id_lembaga_mda) {
      await queryInterface.removeColumn('santri', 'id_lembaga_mda', {
        transaction,
      });
    }

    if (tableDesc.id_kelas_formal) {
      await queryInterface.removeColumn('santri', 'id_kelas_formal', {
        transaction,
      });
    }

    if (tableDesc.id_kelas_mda) {
      await queryInterface.removeColumn('santri', 'id_kelas_mda', {
        transaction,
      });
    }
  });
};
