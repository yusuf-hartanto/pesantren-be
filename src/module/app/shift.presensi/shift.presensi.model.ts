'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import LembagaPendidikanFormal from '../lembaga.pendidikan.formal/lembaga.pendidikan.formal.model';
import Pegawai from '../pegawai/pegawai.model';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';
import Tingkat from '../tingkat/tingkat.model';

export class ShiftPresensi extends Model {
  public id_shift!: string;
  public kode_shift!: string;
  public nama_shift!: string;
  public kategori_shift!: string;
  public waktu_mulai!: Date;
  public waktu_selesai!: Date;
  public toleransi_menit!: number;
  public is_wajib!: boolean;
  public keterangan!: string;
  public status!: string;
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
        defaultValue: false 
      },
      keterangan: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM('Aktif', 'Nonaktif'),
      }
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

export function associateShiftPresensi() {

}

export default ShiftPresensi;
