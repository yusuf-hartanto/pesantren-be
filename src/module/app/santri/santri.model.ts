'use strict';

import { v4 as uuidv4 } from 'uuid';
import Cabang from '../cabang/cabang.model';
import { DataTypes, Model, Sequelize } from 'sequelize';
import AppInstitution from '../institution/institution.model';
import OrangTuaWali from '../orang.tua.wali/orang.tua.wali.model';

export class AppSantri extends Model {
  declare id_wali: string;
  declare fullname: string;
  declare nis: string;
  declare nik: string;
  declare gender: string;
  declare birth_place: string;
  declare birth_date: Date;
  declare phone: string;
  declare id_cabang: string;
  declare nama_cabang: string;
  declare id_institution: string;
  declare institution_name: string;
  declare group_code_1: string;
  declare group_code_2: string;
  declare group_code_3: string;
  declare nomor_nasabah: string;
  declare kartu_santri_nomor: string;
  declare kartu_santri: string;
  declare status: number;
  declare created_at: Date;
  declare updated_at: Date;
  declare id_santri_sitrendi: string;
  declare id_wali_sitrendi: string;
  declare institution_id_sitrendi: string;
}

export function initAppSantri(sequelize: Sequelize) {
  AppSantri.init(
    {
      id_santri: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_wali: {
        type: DataTypes.STRING,
      },
      fullname: {
        type: DataTypes.STRING,
      },
      nis: {
        type: DataTypes.STRING,
      },
      nik: {
        type: DataTypes.STRING,
        unique: true,
      },
      gender: {
        type: DataTypes.ENUM('L','P'),
        defaultValue: null,
      },
      birth_place: {
        type: DataTypes.STRING,
      },
      birth_date: {
        type: DataTypes.DATEONLY,
      },
      phone: {
        type: DataTypes.STRING,
      },
      id_cabang: {
        type: DataTypes.STRING,
      },
      nama_cabang: {
        type: DataTypes.STRING,
      },
      id_institution: {
        type: DataTypes.STRING,
      },
      institution_name: {
        type: DataTypes.STRING,
      },
      group_code_1: {
        type: DataTypes.STRING,
      },
      group_code_2: {
        type: DataTypes.STRING,
      },
      group_code_3: {
        type: DataTypes.STRING,
      },
      nomor_nasabah: {
        type: DataTypes.STRING,
      },
      kartu_santri_nomor: {
        type: DataTypes.STRING,
      },
      kartu_santri: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
      },
      keterangan: {
        type: DataTypes.TEXT,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
      id_santri_sitrendi: {
        type: DataTypes.STRING,
        unique: true,
      },
      id_wali_sitrendi: {
        type: DataTypes.STRING,
        unique: true,
      },
      institution_id_sitrendi: {
        type: DataTypes.STRING,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: 'AppSantri',
      tableName: 'santri',
      timestamps: false,
    }
  );

  AppSantri.beforeCreate((row) => {
    row?.setDataValue('id_santri', uuidv4());
  });
  return AppSantri;
}

export function associateAppSantri() {
  AppSantri.belongsTo(Cabang, { as: 'cabang', foreignKey: 'id_cabang' });
  AppSantri.belongsTo(AppInstitution, { as: 'institution', foreignKey: 'id_institution' });
  AppSantri.belongsTo(OrangTuaWali, { as: 'wali', foreignKey: 'id_wali', targetKey: 'id_wali' });
}

export default AppSantri;
