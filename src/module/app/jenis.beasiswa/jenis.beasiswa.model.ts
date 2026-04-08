'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class JenisBeasiswa extends Model {
  declare id_beasiswa: string;
  declare kode_beasiswa: string;
  declare nama_beasiswa: string;
  declare nomor_urut: number;
  declare keterangan: string;
  declare status: string;
}

export function initJenisBeasiswa(sequelize: Sequelize) {
  JenisBeasiswa.init(
    {
      id_beasiswa: {
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
      keterangan: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM('Aktif', 'Nonaktif'),
      },
    },
    {
      sequelize,
      modelName: 'JenisBeasiswa',
      tableName: 'jenis_beasiswa',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  JenisBeasiswa.beforeCreate((row) => {
    row?.setDataValue('id_beasiswa', uuidv4());
  });

  return JenisBeasiswa;
}

export default JenisBeasiswa;
