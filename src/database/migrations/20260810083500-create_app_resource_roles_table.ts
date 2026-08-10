'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('app_resource_roles', {
    id_resource_role: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    resource_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'app_resource',
        key: 'resource_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    role_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'app_role',
        key: 'role_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    id_pegawai: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'pegawai',
        key: 'id_pegawai',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    id_cabang: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'cabang',
        key: 'id_cabang',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    id_orgunit: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'orgunit',
        key: 'id_orgunit',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    id_lembaga: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lembaga_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_default: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    modified_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('app_resource_roles');
};
