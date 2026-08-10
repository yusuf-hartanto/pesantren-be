'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import AppResource from '../resource/resource.model';
import AppRole from '../role/role.model';
import Pegawai from '../pegawai/pegawai.model';
import Cabang from '../cabang/cabang.model';
import OrganizationUnit from '../organization.unit/organization.unit.model';
import LembagaPendidikanFormal from '../lembaga.pendidikan.formal/lembaga.pendidikan.formal.model';
import LembagaPendidikanKepesantrenan from '../lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.model';

export class AppResourceRole extends Model {
  declare id_resource_role: string;
  declare resource_id: string;
  declare role_id: string;
  declare id_pegawai?: string | null;
  declare id_cabang?: string | null;
  declare id_orgunit?: string | null;
  declare id_lembaga?: string | null;
  declare lembaga_type?: string | null;
  declare is_default: number;
  declare status: string;
  declare created_by?: string | null;
  declare created_at: Date;
  declare modified_by?: string | null;
  declare updated_at: Date;

  declare resource?: AppResource;
  declare role?: AppRole;
  declare pegawai?: Pegawai;
  declare cabang?: Cabang;
  declare organizationUnit?: OrganizationUnit;
  declare lembagaPendidikanFormal?: LembagaPendidikanFormal;
  declare lembagaPendidikanKepesantrenan?: LembagaPendidikanKepesantrenan;
}

export function initAppResourceRole(sequelize: Sequelize) {
  AppResourceRole.init(
    {
      id_resource_role: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      resource_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      id_pegawai: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      id_cabang: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      id_orgunit: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      id_lembaga: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lembaga_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_default: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'ACTIVE',
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      modified_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'AppResourceRole',
      tableName: 'app_resource_roles',
      timestamps: false,
    }
  );

  AppResourceRole.beforeCreate((row) => {
    if (!row.getDataValue('id_resource_role')) {
      row.setDataValue('id_resource_role', uuidv4());
    }
  });

  AppResourceRole.beforeBulkCreate((rows) => {
    for (const row of rows) {
      if (!row.getDataValue('id_resource_role')) {
        row.setDataValue('id_resource_role', uuidv4());
      }
    }
  });

  return AppResourceRole;
}

export function associateAppResourceRole() {
  AppResourceRole.belongsTo(AppResource, { as: 'resource', foreignKey: 'resource_id' });
  AppResourceRole.belongsTo(AppRole, { as: 'role', foreignKey: 'role_id' });
  AppResourceRole.belongsTo(Pegawai, { as: 'pegawai', foreignKey: 'id_pegawai' });
  AppResourceRole.belongsTo(Cabang, { as: 'cabang', foreignKey: 'id_cabang' });
  AppResourceRole.belongsTo(OrganizationUnit, { as: 'organizationUnit', foreignKey: 'id_orgunit' });
  AppResourceRole.belongsTo(LembagaPendidikanFormal, {
    foreignKey: 'id_lembaga',
    as: 'lembagaPendidikanFormal',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  AppResourceRole.belongsTo(LembagaPendidikanKepesantrenan, {
    foreignKey: 'id_lembaga',
    as: 'lembagaPendidikanKepesantrenan',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export default AppResourceRole;
