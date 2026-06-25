'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import JadwalPelajaran from '../jadwal.pelajaran/jadwal.pelajaran.model';
import Pegawai from '../pegawai/pegawai.model';
import AppResource from '../resource/resource.model';

export class GuruPengganti extends Model {
  declare id_pengganti: string;
  declare id_jadwal: string;
  declare id_guru_asli: string;
  declare id_guru_pengganti: string;
  declare tanggal: string;
  declare alasan: string;
  declare status_approval: string;
}

export function initGuruPengganti(sequelize: Sequelize) {
  GuruPengganti.init(
    {
      id_pengganti: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_jadwal: {
        type: DataTypes.STRING,
      },
      id_guru_asli: {
        type: DataTypes.STRING,
      },
      id_guru_pengganti: {
        type: DataTypes.STRING,
      },
      tanggal: {
        type: DataTypes.DATEONLY,
      },
      alasan: {
        type: DataTypes.TEXT,
      },
      status_approval: {
        type: DataTypes.ENUM('Menunggu', 'Disetujui', 'Ditolak'),
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      approved_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'GuruPengganti',
      tableName: 'guru_pengganti',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  GuruPengganti.beforeCreate((row) => {
    row?.setDataValue('id_pengganti', uuidv4());
  });

  return GuruPengganti;
}

export function associateGuruPengganti() {
  GuruPengganti.belongsTo(JadwalPelajaran, {
    as: 'jadwal_pelajaran',
    foreignKey: 'id_jadwal',
  });

  GuruPengganti.belongsTo(Pegawai, {
    as: 'guru_asli',
    foreignKey: 'id_guru_asli',
  });

  GuruPengganti.belongsTo(Pegawai, {
    as: 'guru_pengganti',
    foreignKey: 'id_guru_pengganti',
  });

  GuruPengganti.belongsTo(AppResource, {
    as: 'createdBy',
    foreignKey: 'created_by',
  });

  GuruPengganti.belongsTo(AppResource, {
    as: 'approvedBy',
    foreignKey: 'approved_by',
  });
}

export default GuruPengganti;
