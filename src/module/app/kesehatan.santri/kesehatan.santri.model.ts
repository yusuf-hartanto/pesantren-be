'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';

import Santri from '../santri/santri.model';
import Pegawai from '../pegawai/pegawai.model';
import PerizinanSantri from '../perizinan.santri/perizinan.santri.model';
import AppResource from '../resource/resource.model';

export class KesehatanSantri extends Model {
  declare id_kesehatan: string;
  declare id_santri: string | null;
  declare id_pegawai: string | null;
  declare id_petugas: string;
  declare tanggal_event: Date;
  declare kategori_sakit: 'Ringan' | 'Sedang' | 'Berat';
  declare progres_status: 'Selesai' | 'Dirawat' | 'Dirujuk';
  declare keluhan: string;
  declare tindakan: string | null;
  declare obat_diberikan: string | null;
  declare tanggal_mulai_rawat: Date | null;
  declare tempat_dirawat: string | null;
  declare estimasi_hari: number | null;
  declare tanggal_dirujuk: Date | null;
  declare tempat_rujukan: string | null;
  declare perizinan_id: string | null;
  declare sumber_pengajuan: 'Kesehatan' | null;
  declare izin_auto_created: boolean;
  declare keterangan: string | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare is_deleted: boolean;
  declare deleted_at: Date | null;

  declare santri?: Santri;
  declare pegawai?: Pegawai;
  declare petugas?: Pegawai;
  declare perizinan?: PerizinanSantri;
}

export function initKesehatanSantri(sequelize: Sequelize) {
  KesehatanSantri.init(
    {
      id_kesehatan: {
        type: DataTypes.STRING(255),
        primaryKey: true,
        allowNull: false,
      },
      id_santri: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      id_pegawai: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      id_petugas: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      tanggal_event: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
        get() {
          const value = this.getDataValue('tanggal_event');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value
            ? moment(value).format('YYYY-MM-DD HH:mm:ss')
            : null;
          this.setDataValue('tanggal_event', formattedValue);
        },
      },
      kategori_sakit: {
        type: DataTypes.ENUM('Ringan', 'Sedang', 'Berat'),
        allowNull: false,
      },
      progres_status: {
        type: DataTypes.ENUM('Selesai', 'Dirawat', 'Dirujuk'),
        allowNull: false,
      },
      keluhan: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      tindakan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      obat_diberikan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tanggal_mulai_rawat: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
          const value = this.getDataValue('tanggal_mulai_rawat');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value
            ? moment(value).format('YYYY-MM-DD HH:mm:ss')
            : null;
          this.setDataValue('tanggal_mulai_rawat', formattedValue);
        },
      },
      tempat_dirawat: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      estimasi_hari: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      tanggal_dirujuk: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
          const value = this.getDataValue('tanggal_dirujuk');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value
            ? moment(value).format('YYYY-MM-DD HH:mm:ss')
            : null;
          this.setDataValue('tanggal_dirujuk', formattedValue);
        },
      },
      tempat_rujukan: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      perizinan_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      sumber_pengajuan: {
        type: DataTypes.ENUM('Kesehatan'),
        allowNull: true,
      },
      izin_auto_created: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
          const value = this.getDataValue('deleted_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
    },
    {
      sequelize,
      modelName: 'KesehatanSantri',
      tableName: 'kesehatan_santri',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  KesehatanSantri.beforeValidate((kesehatan) => {
    if (!kesehatan.id_kesehatan) {
      kesehatan.setDataValue('id_kesehatan', uuidv4());
    }
  });

  return KesehatanSantri;
}

export function associateKesehatanSantri() {
  KesehatanSantri.belongsTo(Santri, {
    foreignKey: 'id_santri',
    as: 'santri',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  KesehatanSantri.belongsTo(Pegawai, {
    foreignKey: 'id_pegawai',
    as: 'pegawai',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  KesehatanSantri.belongsTo(AppResource, {
    foreignKey: 'id_petugas',
    as: 'petugas',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  KesehatanSantri.belongsTo(PerizinanSantri, {
    foreignKey: 'perizinan_id',
    as: 'perizinan',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export default KesehatanSantri;
