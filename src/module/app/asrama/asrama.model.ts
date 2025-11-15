'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
//import Cabang from '../cabang/cabang.model';

export class Asrama extends Model {
  public id_asrama!: string;
  public id_cabang!: string;
  public nama_asrama!: string;
  public keterangan!: string;
  public jumlah_kamar!: number;
}

export function initAsrama(sequelize: Sequelize) {
  Asrama.init(
    {
      id_asrama: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_cabang: {
        type: DataTypes.STRING,
      },
      nama_asrama: {
        type: DataTypes.STRING(255),
        unique: true,
      },
      keterangan: {
        type: DataTypes.STRING(255),
      },
      jumlah_kamar: {
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      modelName: 'Asrama',
      tableName: 'asrama',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  Asrama.beforeCreate((row) => {
    row?.setDataValue('id_asrama', uuidv4());
  });

  return Asrama;
}

export function associateAsrama() {
  // Asrama.belongsTo(Cabang, {
  //   as: 'cabang',
  //   foreignKey: 'id_cabang',
  // });
}

export default Asrama;
