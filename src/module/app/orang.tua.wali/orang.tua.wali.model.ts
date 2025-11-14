'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
//import Santri from '../santri/santri.model';

export class OrangTuaWali extends Model {
  public id_wali!: string;
  public id_santri!: string;
  public nama_wali!: string;
  public hubungan!: string;
  public nik!: string;
  public pendidikan!: string;
  public pekerjaan!: string;
  public no_hp!: string;
  public alamat!: string;
}

export function initOrangTuaWali(sequelize: Sequelize) {
  OrangTuaWali.init(
    {
      id_wali: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_santri: {
        type: DataTypes.STRING,
      },
      nama_wali: {
        type: DataTypes.STRING(255),
      },
      hubungan: {
        type: DataTypes.STRING(255),
      },
      nik: {
        type: DataTypes.STRING(255),
      },
      pendidikan: {
        type: DataTypes.STRING(255),
      },
      pekerjaan: {
        type: DataTypes.STRING(255),
      },
      no_hp: {
        type: DataTypes.STRING(255),
      },
      alamat: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: 'OrangTuaWali',
      tableName: 'orang_tua_wali',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  OrangTuaWali.beforeCreate((kegiatan) => {
    kegiatan?.setDataValue('id_wali', uuidv4());
  });

  return OrangTuaWali;
}

export function associateOrangTuaWali() {
  // OrangTuaWali.belongsTo(Santri, {
  //   as: 'santri',
  //   foreignKey: 'id_santri',
  // });
}

export default OrangTuaWali;
