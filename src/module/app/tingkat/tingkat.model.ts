'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class Tingkat extends Model {
  declare id_tingkat: string;
  declare tingkat: string;
  declare tingkat_type: string;
  declare nomor_urut: number;
  declare keterangan: string;
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
      },
      nomor_urut: {
        type: DataTypes.INTEGER,
        unique: true,
      },
      keterangan: {
        type: DataTypes.TEXT,
      },
      tingkat_type: {
        type: DataTypes.ENUM('FORMAL', 'PESANTREN'),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Tingkat',
      tableName: 'tingkat',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  Tingkat.beforeCreate((row) => {
    row?.setDataValue('id_tingkat', uuidv4());
  });

  return Tingkat;
}

export default Tingkat;
