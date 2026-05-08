'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';
import Semester from '../semester/semester.model';

export class KegiatanAkademik extends Model {
  declare id_kegiatan: string;
  declare id_tahunajaran: string;
  declare id_semester: string;
  declare id_lembaga_formal: string;
  declare id_lembaga_pesantren: string;
  declare id_cabang: string;
  declare nama_kegiatan: string;
  declare keterangan: string;
  declare tanggal_mulai: Date;
  declare tanggal_selesai: Date;
  declare status: string;
  declare berlaku_untuk: string;
}

export function initKegiatanAkademik(sequelize: Sequelize) {
  KegiatanAkademik.init(
    {
      id_kegiatan: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_tahunajaran: {
        type: DataTypes.STRING,
      },
      id_semester: {
        type: DataTypes.STRING,
      },
      id_lembaga_formal: {
        type: DataTypes.STRING,
      },
      id_lembaga_pesantren: {
        type: DataTypes.STRING,
      },
      id_cabang: {
        type: DataTypes.STRING,
      },
      nama_kegiatan: {
        type: DataTypes.STRING(255),
        unique: true,
      },
      keterangan: {
        type: DataTypes.STRING(255),
      },
      tanggal_mulai: {
        type: DataTypes.DATEONLY,
      },
      tanggal_selesai: {
        type: DataTypes.DATEONLY,
      },
      status: {
        type: DataTypes.ENUM('Aktif', 'Nonaktif'),
      },
      berlaku_untuk: {
        type: DataTypes.ENUM('Semua', 'Formal', 'Pesantren', 'Asrama'),
      },
    },
    {
      sequelize,
      modelName: 'KegiatanAkademik',
      tableName: 'kegiatan_akademik',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  KegiatanAkademik.beforeCreate((row) => {
    row?.setDataValue('id_kegiatan', uuidv4());
  });

  return KegiatanAkademik;
}

export function associateKegiatanAkademik() {
  KegiatanAkademik.belongsTo(TahunAjaran, {
    as: 'tahun_ajaran',
    foreignKey: 'id_tahunajaran',
  });

  KegiatanAkademik.belongsTo(Semester, {
    as: 'semester',
    foreignKey: 'id_semester',
  });
}

export default KegiatanAkademik;
