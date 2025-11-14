'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import ActivityLog from '../../global/activity.log.model';

export class KelompokPelajaran extends Model {
  public id_kelpelajaran!: string;
  public tahun_ajaran!: string;
  public nomor_urut!: number;
  public keterangan!: string;
  public status!: string;
}

export function initKelompokPelajaran(sequelize: Sequelize) {
  KelompokPelajaran.init(
    {
      id_kelpelajaran: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      nama_kelpelajaran: {
        type: DataTypes.STRING(255),
        unique: true,
      },
      nomor_urut: {
        type: DataTypes.INTEGER,
        unique: true,
      },
      keterangan: {
        type: DataTypes.STRING(255),
      },
      status: {
        type: DataTypes.STRING(255),
        defaultValue: 'A',
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'KelompokPelajaran',
      tableName: 'kelompok_pelajaran',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  KelompokPelajaran.beforeCreate((row) => {
    row?.setDataValue('id_kelpelajaran', uuidv4());
  });

  return KelompokPelajaran;
}

export function associateKelompokPelajaran() {}

export default KelompokPelajaran;
