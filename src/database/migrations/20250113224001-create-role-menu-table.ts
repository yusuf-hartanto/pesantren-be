'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('app_role_menu', {
    role_menu_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    role_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'app_role',
        key: 'role_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    menu_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'app_menu',
        key: 'menu_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    view: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    create: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    edit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    delete: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    approve: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    modified_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('app_role_menu');
};
