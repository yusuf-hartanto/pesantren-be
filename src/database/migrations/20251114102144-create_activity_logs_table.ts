'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('activity_logs', {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      // references: {
      //   model: 'app_resource',
      //   key: 'username',
      // },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    table_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    record_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    before_data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    after_data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('activity_logs');
};
