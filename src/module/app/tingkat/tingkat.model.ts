'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class Tingkat extends Model {
  public id_tingkat!: string;
  public tingkat!: string;
  public nomor_urut!: number;
  public keterangan!: string;
}

export function initTingkat(sequelize: Sequelize) {
  Tingkat.init(
    {
      id_tingkat: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      tingkat: {
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
      modelName: 'Tingkat',
      tableName: 'tingkat',
      timestamps: false,
    }
  );

  Tingkat.beforeCreate((tingkat) => {
    tingkat?.setDataValue('id_tingkat', uuidv4());
  });

  return Tingkat;
}

export default Tingkat;
