'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('area_districts', {
    id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    area_province_id: {
      type: DataTypes.STRING(20),
      allowNull: true,
      references: {
        model: 'area_provinces',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    area_regencies_id: {
      type: DataTypes.STRING(20),
      allowNull: true,
      references: {
        model: 'area_regencies',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('area_districts');
};
