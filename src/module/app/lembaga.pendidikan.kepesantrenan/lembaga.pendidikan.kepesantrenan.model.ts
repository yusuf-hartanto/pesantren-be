'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';
import Cabang from '../cabang/cabang.model';

export class LembagaPendidikanKepesantrenan extends Model {
  public id_lembaga!: string;
  public nama_lembaga!: string;
  public id_cabang!: string | null;
  public keterangan!: string | null;

  // Timestamps otomatis
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date | null;

  // Relasi
  public cabang?: Cabang;
}

export function initLembagaPendidikanKepesantrenan(sequelize: Sequelize) {
  LembagaPendidikanKepesantrenan.init(
    {
      id_lembaga: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      nama_lembaga: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      id_cabang: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      keterangan: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      // Kita tetap gunakan Getters untuk format tampilan di API, 
      // tapi biarkan Sequelize yang mengelola datanya secara otomatis.
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
        get() {
          const value = this.getDataValue('deleted_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
    },
    {
      sequelize,
      tableName: 'lembaga_pendidikan_kepesantrenan',

      // KONFIGURASI OTOMATIS:
      timestamps: true,   // Mengaktifkan created_at & updated_at otomatis
      paranoid: true,     // Mengaktifkan deleted_at otomatis (Soft Delete)
      underscored: true,  // Memastikan format snake_case di database

      // Mapping nama kolom database ke properti model
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  // Hook untuk UUID tetap diperlukan jika ID dikelola oleh Aplikasi (bukan Database)
  LembagaPendidikanKepesantrenan.beforeCreate((lembaga) => {
    if (!lembaga.id_lembaga) {
      lembaga.setDataValue('id_lembaga', uuidv4());
    }
  });

  LembagaPendidikanKepesantrenan.beforeBulkCreate((lembagaInstances) => {
    lembagaInstances.forEach((lembaga) => {
      lembaga.setDataValue('id_lembaga', uuidv4());
    });
  });

  return LembagaPendidikanKepesantrenan;
}

export function associateLembagaPendidikanKepesantrenan() {
  LembagaPendidikanKepesantrenan.belongsTo(Cabang, {
    foreignKey: 'id_cabang',
    as: 'cabang',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export default LembagaPendidikanKepesantrenan;
