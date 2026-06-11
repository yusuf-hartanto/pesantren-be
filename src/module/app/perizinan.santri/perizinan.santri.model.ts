'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';

// Import model terkait relasi (Silakan sesuaikan path import asli project Anda)
import Santri from '../santri/santri.model';
import Lokasi from '../location/location.model';
import AppResource from '../resource/resource.model';
import SuratPerizinanSantri from '../surat.perizinan.santri/surat.perizinan.santri.model';

export class PerizinanSantri extends Model {
  declare id_izin: string;
  declare id_santri: string;
  declare id_lokasi_kamar: string;
  declare sumber_pengajuan: 'Waliasuh' | 'Orang Tua' | 'Kesehatan';
  declare jenis_izin: 'Izin' | 'Sakit';
  declare kondisi: string;
  declare tanggal_pengajuan: Date;
  declare tanggal_mulai: string;
  declare tanggal_selesai: string;
  declare alasan: string;
  declare status_approval: 'Menunggu' | 'Disetujui' | 'Ditolak';
  declare id_approver: string | null;
  declare tanggal_approval: Date | null;
  declare catatan_approval: string | null;
  declare is_canceled: boolean;
  declare is_request_canceled: boolean;
  declare request_canceled_at: Date | null;
  declare request_canceled_catatan: string | null;
  declare canceled_at: Date | null;
  declare canceled_by: string | null;
  declare alasan_penutupan: string | null;
  declare created_by: string;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;

  // Type definition untuk relasi (Eager Loading)
  declare santri?: Santri;
  declare lokasiKamar?: Lokasi;
  declare approver?: AppResource;
  declare canceler?: AppResource;
  declare creator?: AppResource;
}

export function initPerizinanSantri(sequelize: Sequelize) {
  PerizinanSantri.init(
    {
      id_izin: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_santri: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      id_lokasi_kamar: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sumber_pengajuan: {
        type: DataTypes.ENUM('Waliasuh', 'Orang Tua', 'Kesehatan'),
        allowNull: false,
      },
      jenis_izin: {
        type: DataTypes.ENUM('Izin', 'Sakit'),
        allowNull: false,
      },
      kondisi: {
        type: DataTypes.STRING,
      },
      tanggal_pengajuan: {
        type: DataTypes.DATE,
        allowNull: false,
        get() {
          const value = this.getDataValue('tanggal_pengajuan');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
          this.setDataValue('tanggal_pengajuan', formattedValue);
        },
      },
      tanggal_mulai: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      tanggal_selesai: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      alasan: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status_approval: {
        type: DataTypes.ENUM('Menunggu', 'Disetujui', 'Ditolak'),
        allowNull: false,
        defaultValue: 'Menunggu',
      },
      id_approver: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tanggal_approval: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
          const value = this.getDataValue('tanggal_approval');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
          this.setDataValue('tanggal_approval', formattedValue);
        },
      },
      catatan_approval: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_canceled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_request_canceled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      request_canceled_catatan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      request_canceled_at: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
          const value = this.getDataValue('request_canceled_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
          this.setDataValue('request_canceled_at', formattedValue);
        },
      },
      canceled_at: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
          const value = this.getDataValue('canceled_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
          this.setDataValue('canceled_at', formattedValue);
        },
      },
      canceled_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      alasan_penutupan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.STRING,
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
      modelName: 'PerizinanSantri',
      tableName: 'perizinan_santri',
      underscored: true,
      timestamps: true,
      paranoid: true, // Soft Delete aktif (mencari deleted_at otomatis)
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  // Auto UUID generation sebelum record tersimpan ke DB
  PerizinanSantri.beforeCreate((perizinan) => {
    perizinan?.setDataValue('id_izin', uuidv4());
  });

  PerizinanSantri.beforeBulkCreate((perizinanInstances) => {
    perizinanInstances.forEach((perizinan) => {
      perizinan.setDataValue('id_izin', uuidv4());
    });
  });

  return PerizinanSantri;
}

export function associatePerizinanSantri() {
  // Relasi Master Santri
  PerizinanSantri.belongsTo(Santri, {
    foreignKey: 'id_santri',
    as: 'santri',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  // Relasi Master Lokasi (Kamar)
  PerizinanSantri.belongsTo(Lokasi, {
    foreignKey: 'id_lokasi_kamar',
    as: 'lokasiKamar',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  // Relasi Approver (Merujuk ke key resource_id milik app_resource)
  PerizinanSantri.belongsTo(AppResource, {
    foreignKey: 'id_approver',
    targetKey: 'resource_id',
    as: 'approver',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  // Relasi Canceler (Merujuk ke key resource_id milik app_resource)
  PerizinanSantri.belongsTo(AppResource, {
    foreignKey: 'canceled_by',
    targetKey: 'resource_id',
    as: 'canceler',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  // Relasi Creator (Merujuk ke key resource_id milik app_resource)
  PerizinanSantri.belongsTo(AppResource, {
    foreignKey: 'created_by',
    targetKey: 'resource_id',
    as: 'creator',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  PerizinanSantri.hasOne(SuratPerizinanSantri, {
    foreignKey: 'id_izin',
    as: 'suratPerizinan',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
}

export default PerizinanSantri;