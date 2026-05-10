'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('santri', {
    id_santri: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    id_wali: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fullname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nis: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nik: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('L', 'P'),
      allowNull: true,
    },
    birth_place: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    id_institution: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'institution',
        key: 'id_institution',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    institution_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    group_code_1: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    group_code_2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    group_code_3: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nomor_nasabah: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nomor_rekening: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    kartu_santri: {
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
    id_santri_sitrendi: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    id_wali_sitrendi: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    institution_id_sitrendi: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  await queryInterface.addConstraint('santri', {
    fields: ['nik'],
    type: 'unique',
    name: 'unique_santri_nik',
  });
  await queryInterface.addConstraint('santri', {
    fields: ['id_santri_sitrendi', 'institution_id_sitrendi'],
    type: 'unique',
    name: 'unique_santri_institution_sitrendi',
  });
  await queryInterface.addIndex('santri', ['nik']);
  await queryInterface.addIndex('santri', ['institution_id']);
  await queryInterface.addIndex('santri', ['id_wali']);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('santri');
  try {
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_santri_gender";'
    );
  } catch (e) {}

  try {
    await queryInterface.sequelize.query(
      'DROP CONSTRAINT IF EXISTS "unique_santri_nik";'
    );
  } catch (e) {}

  try {
    await queryInterface.sequelize.query(
      'DROP CONSTRAINT IF EXISTS "unique_santri_institution_sitrendi";'
    );
  } catch (e) {}
};
