'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import Pegawai from '../pegawai/pegawai.model';
import Cabang from '../cabang/cabang.model';
import MasterSlotWaktu from '../master.slot.waktu/master.slot.waktu.model';

export class JadwalInspeksiKebersihan extends Model {
  declare id_jadwal: string;
  declare id_cabang: string;
  declare id_petugas: string;
  declare kode_slot: string;
  declare hari: number;
  declare keterangan: string;
  declare is_active: boolean;
  declare master_slot_waktu?: MasterSlotWaktu;
}

export function initJadwalInspeksiKebersihan(sequelize: Sequelize) {
  JadwalInspeksiKebersihan.init(
    {
      id_jadwal: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_cabang: {
        type: DataTypes.STRING,
      },
      id_petugas: {
        type: DataTypes.STRING,
      },
      kode_slot: {
        type: DataTypes.STRING,
      },
      hari: {
        type: DataTypes.SMALLINT,
      },
      keterangan: {
        type: DataTypes.TEXT,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'JadwalInspeksiKebersihan',
      tableName: 'jadwal_inspeksi_kebersihan',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  JadwalInspeksiKebersihan.beforeCreate((row) => {
    row?.setDataValue('id_jadwal', uuidv4());
  });

  return JadwalInspeksiKebersihan;
}

export function associateJadwalInspeksiKebersihan() {
  JadwalInspeksiKebersihan.belongsTo(Cabang, {
    as: 'cabang',
    foreignKey: 'id_cabang',
  });

  JadwalInspeksiKebersihan.belongsTo(Pegawai, {
    as: 'pegawai',
    foreignKey: 'id_petugas',
  });

  JadwalInspeksiKebersihan.belongsTo(MasterSlotWaktu, {
    as: 'master_slot_waktu',
    foreignKey: 'kode_slot',
  });
}

export default JadwalInspeksiKebersihan;
