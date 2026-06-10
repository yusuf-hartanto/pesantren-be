'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';
import AppSantri from '../santri/santri.model';
import Lokasi from '../location/location.model';
import JamPelajaran from '../jam.pelajaran/jam.pelajaran.model';
import Pegawai from '../pegawai/pegawai.model';
import AppResource from '../resource/resource.model';

export class AbsenKelasSantri extends Model {
  declare id_absen: string;
  declare id_santri: string;
  declare id_lokasi: string;
  declare id_jam_pelajaran: string;
  declare tanggal: Date | string;
  declare waktu_absen: string;
  declare status_kehadiran: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';
  declare keterangan: string | null;
  declare id_petugas: string | null;
  declare created_at: Date;
  declare updated_at: Date;

  // Relasi Ke Model Lain
  declare santri?: AppSantri;
  declare lokasi?: Lokasi;
  declare jamPelajaran?: JamPelajaran;
  declare petugas?: Pegawai;
  declare resource?: AppResource;
}

export function initAbsenKelasSantri(sequelize: Sequelize) {
  AbsenKelasSantri.init(
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
        defaultValue: () => moment().format('HH:mm:ss'),
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
      modelName: 'AbsenKelasSantri',
      tableName: 'absen_kelas_santri',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      indexes: [
        {
          name: 'unique_absen_kelas_pelajaran',
          unique: true,
          fields: ['id_santri', 'tanggal', 'id_jam_pelajaran'],
          where: {
            deleted_at: null,
          },
        },
      ],
    }
  );

  AbsenKelasSantri.beforeCreate((absen) => {
    absen?.setDataValue('id_absen', uuidv4());
  });

  AbsenKelasSantri.beforeBulkCreate((absenInstances) => {
    absenInstances.forEach((absen) => {
      absen.setDataValue('id_absen', uuidv4());
    });
  });

  return AbsenKelasSantri;
}

export function associateAbsenKelasSantri() {
  AbsenKelasSantri.belongsTo(AppSantri, {
    foreignKey: 'id_santri',
    as: 'santri',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  AbsenKelasSantri.belongsTo(Lokasi, {
    foreignKey: 'id_lokasi',
    as: 'lokasi',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  AbsenKelasSantri.belongsTo(JamPelajaran, {
    foreignKey: 'id_jam_pelajaran',
    as: 'jamPelajaran',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  AbsenKelasSantri.belongsTo(Pegawai, {
    foreignKey: 'id_petugas',
    as: 'petugas',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  AbsenKelasSantri.belongsTo(AppResource, {
    foreignKey: 'id_petugas',
    as: 'resource',
  });
}

export default AbsenKelasSantri;
