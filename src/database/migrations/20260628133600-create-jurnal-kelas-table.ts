'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.createTable(
      'jurnal_kelas',
      {
        id_jurnal: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
          unique: true,
        },
        id_petugas: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
            model: 'app_resource',
            key: 'resource_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        id_lokasi: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        id_jam_pelajaran: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        tanggal: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        jam_mulai: {
          type: DataTypes.TIME,
          allowNull: false,
        },
        jam_selesai: {
          type: DataTypes.TIME,
          allowNull: true,
        },
        materi: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        catatan: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        created_by: {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: 'app_resource',
            key: 'resource_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      { transaction }
    );
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.dropTable('jurnal_kelas', { transaction });
  });
};
