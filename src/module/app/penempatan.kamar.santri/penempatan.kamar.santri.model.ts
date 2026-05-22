'use strict';

import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import Santri from '../santri/santri.model';
import Lokasi from '../location/location.model';
import { DataTypes, Model, Sequelize } from 'sequelize';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';

export class PenempatanKamarSantri extends Model {
  declare id_penempatan: string;
  declare id_santri: string;
  declare id_lokasi: string;
  declare id_tahunajaran: string;
  declare tanggal_masuk: Date;
  declare tanggal_keluar: Date;
  declare status: string;
  declare keterangan: string;
  declare is_deleted: boolean;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date;

  // Relasi
  declare santri?: Santri;
  declare lokasi?: Lokasi;
  declare tahunAjaran?: TahunAjaran;
}

export function initPenempatanKamarSantri(sequelize: Sequelize) {
  PenempatanKamarSantri.init(
    {
      id_penempatan: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_santri: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      id_lokasi: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      id_tahunajaran: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tanggal_masuk: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      tanggal_keluar: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Aktif', 'Non-Aktif'),
        defaultValue: 'Aktif',
      },
      keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: false,
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'PenempatanKamarSantri',
      tableName: 'penempatan_kamar_santri',
      timestamps: false,
    }
  );

  // UUID Otomatis sebelum create
  PenempatanKamarSantri.beforeCreate((kamar) => {
    kamar?.setDataValue('id_penempatan', uuidv4());
  });

  PenempatanKamarSantri.beforeBulkCreate((kamarInstances) => {
    kamarInstances.forEach((kamar) => {
      kamar.setDataValue('id_penempatan', uuidv4());
    });
  });

  return PenempatanKamarSantri;
}

export function associatePenempatanKamarSantri() {
  PenempatanKamarSantri.belongsTo(Santri, {
    foreignKey: 'id_santri',
    as: 'santri',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  PenempatanKamarSantri.belongsTo(Lokasi, {
    foreignKey: 'id_lokasi',
    as: 'lokasi',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  PenempatanKamarSantri.belongsTo(TahunAjaran, {
    foreignKey: 'id_tahunajaran',
    as: 'tahunAjaran',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export default PenempatanKamarSantri;
