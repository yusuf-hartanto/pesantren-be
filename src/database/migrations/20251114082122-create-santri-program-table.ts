'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('t_santri_program', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    id_santri: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'santri',
        key: 'id_santri',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    id_program: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'program_pesantren',
        key: 'id_program',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    tgl_mulai: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    tgl_selesai: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Aktif', 'Lulus', 'Drop'),
      allowNull: true,
      defaultValue: 'Aktif',
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('t_santri_program');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_t_santri_program_status";');
};
