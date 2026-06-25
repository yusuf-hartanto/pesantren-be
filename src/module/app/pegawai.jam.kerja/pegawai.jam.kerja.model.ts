'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';
import Pegawai from '../pegawai/pegawai.model';
import Lokasi from '../location/location.model';

export class JamKerjaPegawai extends Model {
  declare id_jamkerja: string;
  declare id_pegawai: string;
  declare id_lokasi: string;
  declare waktu_mulai: string;
  declare waktu_selesai: string;
  declare keterangan: string;
  declare is_active: boolean;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;

  // Relasi
  declare pegawai?: Pegawai;
  declare lokasiKerja?: Lokasi; // Diubah dari lokasiKamar menjadi lokasiKerja
}

export function initJamKerjaPegawai(sequelize: Sequelize) {
  JamKerjaPegawai.init(
    {
      id_jamkerja: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_pegawai: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      id_lokasi: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      waktu_mulai: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      waktu_selesai: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      keterangan: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      },
    },
    {
      sequelize,
      modelName: 'JamKerjaPegawai',
      tableName: 'jam_kerja_pegawai',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  JamKerjaPegawai.beforeCreate((jamKerja) => {
    jamKerja?.setDataValue('id_jamkerja', uuidv4());
  });

  JamKerjaPegawai.beforeBulkCreate((jamKerjaInstances) => {
    jamKerjaInstances.forEach((jamKerja) => {
      jamKerja.setDataValue('id_jamkerja', uuidv4());
    });
  });

  return JamKerjaPegawai;
}

export function associateJamKerjaPegawai() {
  JamKerjaPegawai.belongsTo(Pegawai, {
    foreignKey: 'id_pegawai',
    as: 'pegawai',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  JamKerjaPegawai.belongsTo(Lokasi, {
    foreignKey: 'id_lokasi',
    as: 'lokasiKerja',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
}

export default JamKerjaPegawai;
