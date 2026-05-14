'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('geo_areas', {
    id_geo: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    id_lokasi: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'lokasi',
        key: 'id_lokasi',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    nama_area: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    tipe_geo: {
      type: DataTypes.ENUM('POINT', 'CIRCLE', 'POLYGON'),
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    radius_meter: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    polygon_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    toleransi_meter: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    versi: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
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
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('geo_areas');
}
