'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class StatusAwalSantri extends Model {
  public id_statawalsantri!: string;
  public kode_statawal!: string;
  public nama_statawal!: string;
  public nomor_urut!: number;
  public keterangan!: string;
  public status!: string;
}

export function initStatusAwalSantri(sequelize: Sequelize) {
  StatusAwalSantri.init(
    {
      id_statawalsantri: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      kode_statawal: {
        type: DataTypes.STRING(255),
        unique: true,
      },
      nama_statawal: {
        type: DataTypes.STRING(255),
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
      },
    },
    {
      sequelize,
      modelName: 'StatusAwalSantri',
      tableName: 'status_awal_santri',
      timestamps: false,
    }
  );

  StatusAwalSantri.beforeCreate((status_awal_santri) => {
    status_awal_santri?.setDataValue('id_statawalsantri', uuidv4());
  });

  return StatusAwalSantri;
}

export default StatusAwalSantri;
