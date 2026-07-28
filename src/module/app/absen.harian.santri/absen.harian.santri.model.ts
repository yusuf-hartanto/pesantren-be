'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';
import AppSantri from '../santri/santri.model';
import Lokasi from '../location/location.model';
import ShiftPresensi from '../shift.presensi/shift.presensi.model';
import Pegawai from '../pegawai/pegawai.model';
import AppResource from '../resource/resource.model';
import { TIMEZONE } from '../../../utils/constant';

export class AbsenHarianSantri extends Model {
  declare id_absen: string;
  declare id_santri: string;
  declare id_lokasi_kamar: string;
  declare id_shift_presensi: string;
  declare tanggal: Date | string;
  declare waktu_absen: string;
  declare status_kehadiran: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';
  declare keterangan: string | null;
  declare id_petugas: string | null;
  declare created_at: Date;
  declare updated_at: Date;

  // Relasi Ke Model Lain
  declare santri?: AppSantri;
  declare lokasiKamar?: Lokasi;
  declare shiftPresensi?: ShiftPresensi;
  declare petugas?: Pegawai;
  declare resource?: AppResource;
}

export function initAbsenHarianSantri(sequelize: Sequelize) {
  AbsenHarianSantri.init(
    {
      id_absen: {
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
      id_shift_presensi: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tanggal: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        get() {
          const value = this.getDataValue('tanggal');
          return value ? moment(value).format('YYYY-MM-DD') : null;
        },
        set(value) {
          const formattedValue = value
            ? moment(value).format('YYYY-MM-DD')
            : null;
          this.setDataValue('tanggal', formattedValue);
        },
      },
      waktu_absen: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: () => moment().tz(TIMEZONE).format('HH:mm:ss'),
      },
      status_kehadiran: {
        type: DataTypes.ENUM('Hadir', 'Izin', 'Sakit', 'Alfa'),
        allowNull: false,
        defaultValue: 'Hadir',
      },
      keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      id_petugas: {
        type: DataTypes.STRING,
        allowNull: true,
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
      modelName: 'AbsenHarianSantri',
      tableName: 'absen_harian_santri',
      underscored: true,
      timestamps: true,
      paranoid: true, // Otomatis mengelola soft delete melalui kolom deleted_at
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      indexes: [
        {
          name: 'unique_absen_santri_shift_per_hari',
          unique: true,
          fields: ['id_santri', 'tanggal', 'id_shift_presensi'],
          where: {
            deleted_at: null,
          },
        },
      ],
    }
  );

  // Otomatisasi UUID sebelum entitas disimpan ke database
  AbsenHarianSantri.beforeCreate((absen) => {
    absen?.setDataValue('id_absen', uuidv4());
  });

  AbsenHarianSantri.beforeBulkCreate((absenInstances) => {
    absenInstances.forEach((absen) => {
      absen.setDataValue('id_absen', uuidv4());
    });
  });

  return AbsenHarianSantri;
}

export function associateAbsenHarianSantri() {
  AbsenHarianSantri.belongsTo(AppSantri, {
    foreignKey: 'id_santri',
    as: 'santri',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT', // Menjaga integritas data jika data santri tidak sengaja terhapus
  });

  AbsenHarianSantri.belongsTo(Lokasi, {
    foreignKey: 'id_lokasi_kamar',
    as: 'lokasiKamar',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  AbsenHarianSantri.belongsTo(ShiftPresensi, {
    foreignKey: 'id_shift_presensi',
    as: 'shiftPresensi',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  AbsenHarianSantri.belongsTo(Pegawai, {
    foreignKey: 'id_petugas',
    as: 'petugas',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  AbsenHarianSantri.belongsTo(AppResource, {
    foreignKey: 'id_petugas',
    as: 'resource',
  });
}

export default AbsenHarianSantri;
