'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('institution', {
    id_institution: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    institution_id_sitrendi: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    institution_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.SMALLINT, // 0: inactive, 1: active, 9: delete
      allowNull: true,
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addConstraint('institution', {
    fields: ['institution_id_sitrendi'],
    type: 'unique',
    name: 'unique_institution_institution_id_sitrendi',
  });

  await queryInterface.addIndex('institution', ['institution_id_sitrendi']);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('institution');
  try {
    await queryInterface.sequelize.query(
      'DROP CONSTRAINT IF EXISTS "unique_institution_institution_id_sitrendi";'
    );
  } catch (e) {}
};
