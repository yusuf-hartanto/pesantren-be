'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class BeasiswaSantri extends Model {
  public id_beasiswasantri!: string;
  public kode_beasiswa!: string;
  public nama_beasiswa!: string;
  public nomor_urut!: number;
  public keterangan!: string;
  public status!: string;
}

export function initBeasiswaSantri(sequelize: Sequelize) {
  BeasiswaSantri.init(
    {
      id_beasiswasantri: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      kode_beasiswa: {
        type: DataTypes.STRING(255),
        unique: true,
      },
      nama_beasiswa: {
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
      modelName: 'BeasiswaSantri',
      tableName: 'beasiswa_santri',
      timestamps: false,
    }
  );

  BeasiswaSantri.beforeCreate((beasiswa_santri) => {
    beasiswa_santri?.setDataValue('id_beasiswasantri', uuidv4());
  });

  return BeasiswaSantri;
}

export default BeasiswaSantri;
