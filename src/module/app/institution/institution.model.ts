'use strict';

import { v4 as uuidv4 } from 'uuid';
import AppSantri from '../santri/santri.model';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class AppInstitution extends Model {
  declare id_institution: string;
  declare institution_id_sitrendi: string;
  declare status: number;
  declare institution_name: string;
  declare keterangan: string;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initAppInstitution(sequelize: Sequelize) {
  AppInstitution.init(
    {
      id_institution: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      institution_id_sitrendi: {
        type: DataTypes.STRING,
        unique: true,
      },
      institution_name: {
        type: DataTypes.STRING,
      },
      keterangan: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
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
      modelName: 'AppInstitution',
      tableName: 'institution',
      timestamps: false,
    }
  );

  AppInstitution.beforeCreate((row) => {
    row?.setDataValue('id_institution', uuidv4());
  });
  return AppInstitution;
}

export function associateAppInstitution() {
  AppInstitution.hasMany(AppSantri, { as: 'santri', foreignKey: 'id_institution' });
}

export default AppInstitution;
