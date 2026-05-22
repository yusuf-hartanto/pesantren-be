'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import InventarisUmum from '../inventaris.umum/inventaris.umum.model';
import Asrama from '../asrama/asrama.model';

export class InventarisAsetHarian extends Model {
  declare id_laporan: string;
  declare id_aset: string;
  declare id_asrama: string;
  declare id_kamar: string;
  declare id_biro_aset: string;
  declare id_rumah_tangga: string;
  declare tanggal: Date;
  declare kondisi: string;
  declare foto_dokumentasi: Date;
  declare status_progres: Date;
  declare catatan: string;
  declare jenis_input: string;
}

export function initInventarisAsetHarian(sequelize: Sequelize) {
  InventarisAsetHarian.init(
    {
      id_laporan: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_aset: {
        type: DataTypes.STRING,
      },
      id_asrama: {
        type: DataTypes.STRING,
      },
      id_kamar: {
        type: DataTypes.STRING,
      },
      id_biro_aset: {
        type: DataTypes.STRING,
      },
      id_rumah_tangga: {
        type: DataTypes.STRING,
      },
      tanggal: {
        type: DataTypes.DATEONLY,
      },
      kondisi: {
        type: DataTypes.ENUM('Baik', 'Kurang Baik', 'Rusak', 'Hilang'),
      },
      foto_dokumentasi: {
        type: DataTypes.STRING(255),
      },
      status_progres: {
        type: DataTypes.ENUM(
          'Normal',
          'Menunggu Approval',
          'Perbaikan',
          'Penggantian',
          'Selesai'
        ),
      },
      catatan: {
        type: DataTypes.TEXT,
      },
      jenis_input: {
        type: DataTypes.ENUM('Laporan Kondisi', 'Inventaris Baru'),
      },
    },
    {
      sequelize,
      modelName: 'InventarisAsetHarian',
      tableName: 'inventaris_aset_harian',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  InventarisAsetHarian.beforeCreate((row) => {
    row?.setDataValue('id_laporan', uuidv4());
  });

  return InventarisAsetHarian;
}

export function associateInventarisAsetHarian() {
  InventarisAsetHarian.belongsTo(InventarisUmum, {
    as: 'inventaris_umum',
    foreignKey: 'id_aset',
  });

  InventarisAsetHarian.belongsTo(Asrama, {
    as: 'asrama',
    foreignKey: 'id_asrama',
  });
}

export default InventarisAsetHarian;
