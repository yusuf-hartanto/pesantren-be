'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import Pegawai from '../pegawai/pegawai.model';
import Cabang from '../cabang/cabang.model';
import Lokasi from '../location/location.model';
import JadwalInspeksiKebersihan from '../jadwal.inspeksi.kebersihan/jadwal.inspeksi.kebersihan.model';
import KebersihanTemuan from '../kebersihan.temuan/kebersihan.temuan.model';

export class KebersihanInspeksi extends Model {
  declare id_inspeksi: string;
  declare id_cabang: string;
  declare id_lokasi: string;
  declare id_petugas: string;
  declare id_jadwal: string;
  declare tanggal: string;
  declare waktu: string;
  declare kode_slot: string;
  declare status_kondisi: string;
  declare catatan_umum: string;
}

export function initKebersihanInspeksi(sequelize: Sequelize) {
  KebersihanInspeksi.init(
    {
      id_inspeksi: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_cabang: {
        type: DataTypes.STRING,
      },
      id_lokasi: {
        type: DataTypes.STRING,
      },
      id_petugas: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      id_jadwal: {
        type: DataTypes.STRING,
      },
      tanggal: {
        type: DataTypes.DATEONLY,
      },
      waktu: {
        type: DataTypes.TIME,
      },
      kode_slot: {
        type: DataTypes.ENUM('PAGI', 'SIANG', 'SORE', 'MALAM'),
      },
      status_kondisi: {
        type: DataTypes.ENUM('BERSIH', 'KOTOR', 'RUSAK'),
      },
      catatan_umum: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: 'KebersihanInspeksi',
      tableName: 'kebersihan_inspeksi',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  KebersihanInspeksi.beforeCreate((row) => {
    row?.setDataValue('id_inspeksi', uuidv4());
  });

  return KebersihanInspeksi;
}

export function associateKebersihanInspeksi() {
  KebersihanInspeksi.belongsTo(Cabang, {
    as: 'cabang',
    foreignKey: 'id_cabang',
  });

  KebersihanInspeksi.belongsTo(Lokasi, {
    as: 'lokasi',
    foreignKey: 'id_lokasi',
  });

  KebersihanInspeksi.belongsTo(JadwalInspeksiKebersihan, {
    as: 'jadwal_inspeksi_kebersihan',
    foreignKey: 'id_jadwal',
  });

  KebersihanInspeksi.belongsTo(Pegawai, {
    as: 'pegawai',
    foreignKey: 'id_petugas',
  });

  KebersihanInspeksi.hasMany(KebersihanTemuan, {
    as: 'temuans',
    foreignKey: 'id_inspeksi',
  });
}

export default KebersihanInspeksi;
