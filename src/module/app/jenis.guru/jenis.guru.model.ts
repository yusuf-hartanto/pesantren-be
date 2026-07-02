'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import Pegawai from '../pegawai/pegawai.model';
import Tingkat from '../tingkat/tingkat.model';
import MataPelajaran from '../mata.pelajaran/mata.pelajaran.model';
import LembagaPendidikanFormal from '../lembaga.pendidikan.formal/lembaga.pendidikan.formal.model';
import LembagaPendidikanKepesantrenan from '../lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.model';

export class JenisGuru extends Model {
  declare id_jenisguru: string;
  declare nama_jenis_guru: string;
  declare id_guru: string;
  declare id_mapel: string;
  declare id_lembaga: string;
  declare lembaga_type: string;
  declare id_tingkat: string;
  declare nomor_urut: number;
  declare keterangan: string;
  declare status: string;
}

export function initJenisGuru(sequelize: Sequelize) {
  JenisGuru.init(
    {
      id_jenisguru: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      nama_jenis_guru: {
        type: DataTypes.STRING(255),
        unique: true,
      },
      id_guru: {
        type: DataTypes.STRING,
      },
      id_mapel: {
        type: DataTypes.STRING,
      },
      id_lembaga: {
        type: DataTypes.STRING,
      },
      lembaga_type: {
        type: DataTypes.STRING,
      },
      id_tingkat: {
        type: DataTypes.STRING,
      },
      nomor_urut: {
        type: DataTypes.INTEGER,
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
      modelName: 'JenisGuru',
      tableName: 'jenis_guru',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  JenisGuru.beforeCreate((row) => {
    row?.setDataValue('id_jenisguru', uuidv4());
  });

  return JenisGuru;
}

export function associateJenisGuru() {
  JenisGuru.belongsTo(Pegawai, {
    as: 'pegawai',
    foreignKey: 'id_guru',
    targetKey: 'id_pegawai',
  });
  JenisGuru.belongsTo(MataPelajaran, {
    as: 'mata_pelajaran',
    foreignKey: 'id_mapel',
  });
  JenisGuru.belongsTo(LembagaPendidikanFormal, {
    as: 'lembaga_formal',
    foreignKey: 'id_lembaga',
  });
  JenisGuru.belongsTo(LembagaPendidikanKepesantrenan, {
    as: 'lembaga_kepesantrenan',
    foreignKey: 'id_lembaga',
  });
  JenisGuru.belongsTo(Tingkat, {
    as: 'tingkat',
    foreignKey: 'id_tingkat',
  });
}

export default JenisGuru;
