'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';

import PerizinanSantri from '../perizinan.santri/perizinan.santri.model';
import AppResource from '../resource/resource.model';

export class SuratPerizinanSantri extends Model {
  declare id_surat: string;
  declare id_izin: string;
  declare urut: number;
  declare tahun: number;
  declare kode_unit: string;
  declare nomor_surat: string;
  declare qrcode_token: string;
  declare tanggal_cetak: Date;
  declare dicetak_oleh: string;
  declare versi_surat: number;
  declare status_surat: 'Aktif' | 'Dicabut';
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;

  // Relasi
  declare perizinanSantri?: PerizinanSantri;
  declare pencetak?: AppResource;
}

export function initSuratPerizinanSantri(sequelize: Sequelize) {
  SuratPerizinanSantri.init(
    {
      id_surat: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_izin: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      urut: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tahun: {
        type: DataTypes.SMALLINT,
        allowNull: false,
      },
      kode_unit: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nomor_surat: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      qrcode_token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tanggal_cetak: {
        type: DataTypes.DATE,
        allowNull: false,
        get() {
          const value = this.getDataValue('tanggal_cetak');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
          this.setDataValue('tanggal_cetak', formattedValue);
        },
      },
      dicetak_oleh: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      versi_surat: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status_surat: {
        type: DataTypes.ENUM('Aktif', 'Dicabut'),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        get() {
          const value = this.getDataValue('created_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
      updated_at: {
        type: DataTypes.DATE,
        get() {
          const value = this.getDataValue('updated_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
    },
    {
      sequelize,
      modelName: 'SuratPerizinanSantri',
      tableName: 'surat_perizinan_santri',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  SuratPerizinanSantri.beforeCreate((surat) => {
    surat?.setDataValue('id_surat', uuidv4());
  });

  SuratPerizinanSantri.beforeBulkCreate((suratInstances) => {
    suratInstances.forEach((surat) => {
      surat.setDataValue('id_surat', uuidv4());
    });
  });

  return SuratPerizinanSantri;
}

export function associateSuratPerizinanSantri() {
  SuratPerizinanSantri.belongsTo(PerizinanSantri, {
    foreignKey: 'id_izin',
    as: 'perizinanSantri',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  SuratPerizinanSantri.belongsTo(AppResource, {
    foreignKey: 'dicetak_oleh',
    targetKey: 'resource_id',
    as: 'pencetak',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
}

export default SuratPerizinanSantri;