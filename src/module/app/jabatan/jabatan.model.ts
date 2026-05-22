'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';
import OrganizationUnit from '../organization.unit/organization.unit.model';
import Pegawai from '../pegawai/pegawai.model';

export class Jabatan extends Model {
  declare id_jabatan: string;
  declare nama_jabatan: string;
  declare id_orgunit: string;
  declare level_jabatan: number;
  declare sifat_jabatan: string;
  declare kode_jabatan: string;
  declare keterangan: string;
  declare created_at: Date;
  declare updated_at: Date;

  // Relasi
  declare orgunit?: OrganizationUnit;
  declare pegawai?: Pegawai;
}

export function initJabatan(sequelize: Sequelize) {
  Jabatan.init(
    {
      id_jabatan: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      nama_jabatan: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      id_orgunit: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      level_jabatan: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sifat_jabatan: {
        type: DataTypes.ENUM('Biro', 'Bagian', 'Lembaga', 'Sub-Unit', 'Umum'),
        allowNull: true,
      },
      kode_jabatan: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      keterangan: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        get() {
          const value = this.getDataValue('created_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value
            ? moment(value).format('YYYY-MM-DD HH:mm:ss')
            : null;
          this.setDataValue('created_at', formattedValue);
        },
      },
      updated_at: {
        type: DataTypes.DATE,
        get() {
          const value = this.getDataValue('updated_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value
            ? moment(value).format('YYYY-MM-DD HH:mm:ss')
            : null;
          this.setDataValue('updated_at', formattedValue);
        },
      },
    },
    {
      sequelize,
      modelName: 'Jabatan',
      tableName: 'jabatan',
      timestamps: true,
      underscored: true,
      paranoid: true,
    }
  );

  // UUID Otomatis sebelum create
  Jabatan.beforeCreate((jabatan) => {
    jabatan?.setDataValue('id_jabatan', uuidv4());
  });

  Jabatan.beforeBulkCreate((jabatanInstances) => {
    jabatanInstances.forEach((jabatan) => {
      jabatan.setDataValue('id_jabatan', uuidv4());
    });
  });

  return Jabatan;
}

export function associateJabatan() {
  Jabatan.belongsTo(OrganizationUnit, {
    foreignKey: 'id_orgunit',
    as: 'orgunit',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  Jabatan.hasMany(Pegawai, {
    foreignKey: 'id_jabatan',
    as: 'pegawai',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export default Jabatan;
