'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import Santri from '../santri/santri.model';
import KelasMda from '../kelas.mda/kelas.mda.model';
import KelasFormal from '../kelas.formal/kelas.formal.model';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';
import AppResource from '../resource/resource.model';

export class PenempatanKelasSantri extends Model {
  declare id: string;
  declare id_santri: string;
  declare id_kelas_mda: string | null;
  declare id_kelas_formal: string | null;
  declare id_tahun_ajaran: string;
  declare tanggal_masuk: Date | string | null;
  declare tanggal_keluar: Date | string | null;
  declare status: 'Aktif' | 'Alumni' | 'Tidak Aktif';
  declare created_by: string;
  declare updated_by: string | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;

  // Associations definitions
  declare santri?: Santri;
  declare kelasMda?: KelasMda;
  declare kelasFormal?: KelasFormal;
  declare tahunAjaran?: TahunAjaran;
  declare creator?: AppResource;
  declare updater?: AppResource;
}

export function initPenempatanKelasSantri(sequelize: Sequelize) {
  PenempatanKelasSantri.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_santri: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      id_kelas_mda: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      id_kelas_formal: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      id_tahun_ajaran: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tanggal_masuk: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      tanggal_keluar: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Aktif', 'Alumni', 'Tidak Aktif'),
        allowNull: false,
        defaultValue: 'Aktif',
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'PenempatanKelasSantri',
      tableName: 'penempatan_kelas_santri',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  PenempatanKelasSantri.beforeCreate((row) => {
    row?.setDataValue('id', uuidv4());
  });

  PenempatanKelasSantri.beforeBulkCreate((rows) => {
    rows.forEach((row) => {
      row.setDataValue('id', uuidv4());
    });
  });

  return PenempatanKelasSantri;
}

export function associatePenempatanKelasSantri() {
  PenempatanKelasSantri.belongsTo(Santri, {
    foreignKey: 'id_santri',
    as: 'santri',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  PenempatanKelasSantri.belongsTo(KelasMda, {
    foreignKey: 'id_kelas_mda',
    as: 'kelasMda',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  PenempatanKelasSantri.belongsTo(KelasFormal, {
    foreignKey: 'id_kelas_formal',
    targetKey: 'id_kelas',
    as: 'kelasFormal',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  PenempatanKelasSantri.belongsTo(TahunAjaran, {
    foreignKey: 'id_tahun_ajaran',
    targetKey: 'id_tahunajaran',
    as: 'tahunAjaran',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  PenempatanKelasSantri.belongsTo(AppResource, {
    foreignKey: 'created_by',
    targetKey: 'resource_id',
    as: 'creator',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  PenempatanKelasSantri.belongsTo(AppResource, {
    foreignKey: 'updated_by',
    targetKey: 'resource_id',
    as: 'updater',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export default PenempatanKelasSantri;
