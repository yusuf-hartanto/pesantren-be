'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';
import Semester from '../semester/semester.model';

export class KegiatanAkademik extends Model {
  public id_kegiatan!: string;
  public id_tahunajaran!: string;
  public id_semester!: string;
  public id_lembaga_formal!: string;
  public id_lembaga_pesantren!: string;
  public id_cabang!: string;
  public nama_kegiatan!: string;
  public keterangan!: string;
  public tanggal_mulai!: Date;
  public tanggal_selesai!: Date;
  public status!: string;
  public berlaku_untuk!: string;
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
