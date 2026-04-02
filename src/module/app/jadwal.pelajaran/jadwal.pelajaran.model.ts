'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';
import JamPelajaran from '../jam.pelajaran/jam.pelajaran.model';
import Semester from '../semester/semester.model';
import JenisGuru from '../jenis.guru/jenis.guru.model';
import Lokasi from '../location/location.model';
import KelasFormal from '../kelas.formal/kelas.formal.model';
import KelasMda from '../kelas.mda/kelas.mda.model';

export class JadwalPelajaran extends Model {
  public id_jadwal!: string;
  public hari!: string;
  public status!: string;
  public keterangan!: string;
  public id_kelas!: string;
  public id_gmapel!: string;
  public id_jam_pelajaran!: string;
  public id_semester!: string;
  public id_tahunajaran!: string;
  public id_lokasi!: string;
}

export function initJadwalPelajaran(sequelize: Sequelize) {
  JadwalPelajaran.init(
    {
      id_jadwal: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_kelas: {
        type: DataTypes.STRING,
      },
      id_gmapel: {
        type: DataTypes.STRING,
      },
      id_jam_pelajaran: {
        type: DataTypes.STRING,
      },
      id_semester: {
        type: DataTypes.STRING,
      },
      id_tahunajaran: {
        type: DataTypes.STRING,
      },
      id_lokasi: {
        type: DataTypes.STRING,
      },
      hari: {
        type: DataTypes.ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'),
      },
      keterangan: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM('Aktif', 'Nonaktif', 'Arsip'),
      },
    },
    {
      sequelize,
      modelName: 'JadwalPelajaran',
      tableName: 'jadwal_pelajaran',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  JadwalPelajaran.beforeCreate((row) => {
    row?.setDataValue('id_jadwal', uuidv4());
  });

  return JadwalPelajaran;
}

export function associateJadwalPelajaran() {

  JadwalPelajaran.belongsTo(JenisGuru, {
    as: 'jenis_guru',
    foreignKey: 'id_gmapel',
  })

  JadwalPelajaran.belongsTo(Semester, {
    as: 'semester',
    foreignKey: 'id_semester',
  });

  JadwalPelajaran.belongsTo(TahunAjaran, {
    as: 'tahun_ajaran',
    foreignKey: 'id_tahunajaran',
  });

  JadwalPelajaran.belongsTo(JamPelajaran, {
    as: 'jam_pelajaran',
    foreignKey: 'id_jam_pelajaran',
  });

  JadwalPelajaran.belongsTo(Lokasi, {
    as: 'lokasi',
    foreignKey: 'id_lokasi',
  });

  JadwalPelajaran.belongsTo(KelasFormal, {
    as: 'kelas_formal',
    foreignKey: 'id_kelas',
  });

  JadwalPelajaran.belongsTo(KelasMda, {
    as: 'kelas_mda',
    foreignKey: 'id_kelas',
  });
}

export default JadwalPelajaran;
