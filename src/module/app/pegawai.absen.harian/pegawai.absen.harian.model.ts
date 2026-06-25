'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';
import Pegawai from '../pegawai/pegawai.model';
import JamKerjaPegawai from '../pegawai.jam.kerja/pegawai.jam.kerja.model';

export class AbsenHarianPegawai extends Model {
  declare id_absen: string;
  declare id_jamkerja: string;
  declare id_pegawai: string;
  declare tanggal: Date;
  declare waktu_masuk: Date;
  declare waktu_keluar: Date;
  declare keterangan_masuk: string;
  declare keterangan_keluar: string;
  declare lat_masuk: number;
  declare long_masuk: number;
  declare lat_keluar: number;
  declare long_keluar: number;
  declare status_kehadiran: string;
  declare created_at: Date;
  declare updated_at: Date;

  // Relasi objek tunggal (belongsTo)
  declare pegawai?: Pegawai;
  declare jamKerjaPegawai?: JamKerjaPegawai;
}

export function initAbsenHarianPegawai(sequelize: Sequelize) {
  AbsenHarianPegawai.init(
    {
      id_absen: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_jamkerja: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      id_pegawai: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tanggal: {
        type: DataTypes.DATEONLY, // Murni menyimpan tanggal YYYY-MM-DD
        allowNull: false,
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
      waktu_masuk: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
          const value = this.getDataValue('waktu_masuk');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value
            ? moment(value).format('YYYY-MM-DD HH:mm:ss')
            : null;
          this.setDataValue('waktu_masuk', formattedValue);
        },
      },
      waktu_keluar: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
          const value = this.getDataValue('waktu_keluar');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value
            ? moment(value).format('YYYY-MM-DD HH:mm:ss')
            : null;
          this.setDataValue('waktu_keluar', formattedValue);
        },
      },
      keterangan_masuk: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      keterangan_keluar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lat_masuk: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      long_masuk: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      lat_keluar: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      long_keluar: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      status_kehadiran: {
        type: DataTypes.ENUM('Hadir', 'Izin', 'Sakit', 'Alfa'),
        allowNull: false,
        defaultValue: 'Hadir',
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
      modelName: 'AbsenHarianPegawai',
      tableName: 'absen_harian_pegawai', // Nama tabel snake_case mengikuti standar model acuan Anda
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  // Otomatisasi UUID sebelum records dimasukkan ke Database
  AbsenHarianPegawai.beforeCreate((absen) => {
    absen?.setDataValue('id_absen', uuidv4());
  });

  AbsenHarianPegawai.beforeBulkCreate((absenInstances) => {
    absenInstances.forEach((absen) => {
      absen.setDataValue('id_absen', uuidv4());
    });
  });

  return AbsenHarianPegawai;
}

export function associateAbsenHarianPegawai() {
  AbsenHarianPegawai.belongsTo(Pegawai, {
    foreignKey: 'id_pegawai',
    as: 'pegawai',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  AbsenHarianPegawai.belongsTo(JamKerjaPegawai, {
    foreignKey: 'id_jamkerja',
    as: 'jamKerjaPegawai',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
}

export default AbsenHarianPegawai;
