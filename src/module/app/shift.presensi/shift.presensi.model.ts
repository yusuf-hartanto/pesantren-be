'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
export class ShiftPresensi extends Model {
  declare id_shift: string;
  declare kode_shift: string;
  declare nama_shift: string;
  declare kategori_shift: string;
  declare waktu_mulai: Date;
  declare waktu_selesai: Date;
  declare toleransi_menit: number;
  declare is_wajib: boolean;
  declare keterangan: string;
  declare status: string;
}

export function initShiftPresensi(sequelize: Sequelize) {
  ShiftPresensi.init(
    {
      id_shift: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      kode_shift: {
        type: DataTypes.STRING(255),
        unique: true,
      },
      nama_shift: {
        type: DataTypes.STRING(255),
      },
      kategori_shift: {
        type: DataTypes.ENUM('ASRAMA', 'PEGAWAI', 'SHOLAT', 'UMUM'),
      },
      waktu_mulai: {
        type: DataTypes.TIME,
      },
      waktu_selesai: {
        type: DataTypes.TIME,
      },
      toleransi_menit: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_wajib: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      keterangan: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM('Aktif', 'Nonaktif'),
      },
    },
    {
      sequelize,
      modelName: 'ShiftPresensi',
      tableName: 'shift_presensi',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  ShiftPresensi.beforeCreate((row) => {
    row?.setDataValue('id_shift', uuidv4());
  });

  return ShiftPresensi;
}

export function associateShiftPresensi() {}

export default ShiftPresensi;
