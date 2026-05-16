'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import Pegawai from '../pegawai/pegawai.model';
import Lokasi from '../location/location.model';
import KebersihanInspeksi from '../kebersihan.inspeksi/kebersihan.inspeksi.model';

export class KebersihanScanLog extends Model {
  declare id_scan_log: string;
  declare id_inspeksi: string;
  declare id_lokasi: string;
  declare id_petugas: string;
  declare id_geo: string;
  declare tanggal: string;
  declare waktu: string;
  declare kode_slot: string;
  declare status_kondisi: string;
  declare catatan_umum: string;
}

export function initKebersihanScanLog(sequelize: Sequelize) {
  KebersihanScanLog.init(
    {
      id_scan_log: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_inspeksi: {
        type: DataTypes.STRING,
      },
      id_lokasi: {
        type: DataTypes.STRING,
      },
      id_petugas: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      id_geo: {
        type: DataTypes.STRING,
      },
      qr_code: {
        type: DataTypes.STRING(255),
      },
      scan_latitude: {
        type: DataTypes.DECIMAL(10, 7),
      },
      scan_longitude: {
        type: DataTypes.DECIMAL(10, 7),
      },
      jarak_meter: {
        type: DataTypes.DECIMAL(8, 2),
      },
      valid_qr: {
        type: DataTypes.BOOLEAN,
      },
      valid_geo: {
        type: DataTypes.BOOLEAN,
      },
      metode_scan: {
        type: DataTypes.ENUM('QR', 'GPS', 'QR+GPS', 'MANUAL'),
      },
      scan_source: {
        type: DataTypes.ENUM('MOBILE', 'PWA', 'WEB'),
      },
      user_agent: {
        type: DataTypes.STRING(255),
      },
      ip_address: {
        type: DataTypes.STRING(255),
      },
      scan_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      keterangan: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: 'KebersihanScanLog',
      tableName: 'kebersihan_scan_log',
      timestamps: false,
    }
  );

  KebersihanScanLog.beforeCreate((row) => {
    row?.setDataValue('id_scan_log', uuidv4());
  });

  return KebersihanScanLog;
}

export function associateKebersihanScanLog() {
  KebersihanScanLog.belongsTo(KebersihanInspeksi, {
    as: 'kebersihan_inspeksi',
    foreignKey: 'id_inspeksi',
  });

  KebersihanScanLog.belongsTo(Lokasi, {
    as: 'lokasi',
    foreignKey: 'id_lokasi',
  });

  KebersihanScanLog.belongsTo(Pegawai, {
    as: 'pegawai',
    foreignKey: 'id_petugas',
  });
}

export default KebersihanScanLog;
