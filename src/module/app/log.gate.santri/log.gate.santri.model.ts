'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';

import PerizinanSantri from '../perizinan.santri/perizinan.santri.model';
import AppResource from '../resource/resource.model';

export class LogGateSantri extends Model {
  declare id_gate: string;
  declare id_izin: string;
  declare waktu_keluar: Date;
  declare petugas_keluar: string;
  declare waktu_masuk: Date | null;
  declare petugas_masuk: string | null;
  declare status_gate: 'Keluar' | 'Kembali';
  declare keterangan: string | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;

  // Relasi
  declare perizinanSantri?: PerizinanSantri;
}

export function initLogGateSantri(sequelize: Sequelize) {
  LogGateSantri.init(
    {
      id_gate: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_izin: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      waktu_keluar: {
        type: DataTypes.DATE,
        allowNull: false,
        get() {
          const value = this.getDataValue('waktu_keluar');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
          this.setDataValue('waktu_keluar', formattedValue);
        },
      },
      petugas_keluar: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      waktu_masuk: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
          const value = this.getDataValue('waktu_masuk');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
          this.setDataValue('waktu_masuk', formattedValue);
        },
      },
      petugas_masuk: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status_gate: {
        type: DataTypes.ENUM('Keluar', 'Kembali'),
        allowNull: false,
      },
      keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        get() {
          const value = this.getDataValue('created_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
      updated_at: {
        type: DataTypes.DATE,
        get() {
          const value = this.getDataValue('updated_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
    },
    {
      sequelize,
      modelName: 'LogGateSantri',
      tableName: 'log_gate_santri',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  LogGateSantri.beforeCreate((log) => {
    log?.setDataValue('id_gate', uuidv4());
  });

  LogGateSantri.beforeBulkCreate((logInstances) => {
    logInstances.forEach((log) => {
      log.setDataValue('id_gate', uuidv4());
    });
  });

  return LogGateSantri;
}

export function associateLogGateSantri() {
  LogGateSantri.belongsTo(PerizinanSantri, {
    foreignKey: 'id_izin',
    as: 'perizinanSantri',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  LogGateSantri.belongsTo(AppResource, {
    foreignKey: 'petugas_keluar',
    targetKey: 'resource_id',
    as: 'petugasKeluarResource',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    constraints: false,
  });

  LogGateSantri.belongsTo(AppResource, {
    foreignKey: 'petugas_masuk',
    targetKey: 'resource_id',
    as: 'petugasMasukResource',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    constraints: false,
  });
}

export default LogGateSantri;