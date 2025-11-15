'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class TahunAngkatan extends Model {
  public id_angkatan!: string;
  public tahun_angkatan!: string;
  public nomor_urut!: number;
  public keterangan!: string;
}

export function initTahunAngkatan(sequelize: Sequelize) {
  TahunAngkatan.init(
    {
      id_angkatan: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      tahun_angkatan: {
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
    },
    {
      sequelize,
      modelName: 'TahunAngkatan',
      tableName: 'tahun_angkatan',
      timestamps: false,
    }
  );

  TahunAngkatan.beforeCreate((row) => {
    row?.setDataValue('id_angkatan', uuidv4());
  });

  return TahunAngkatan;
}

export default TahunAngkatan;
