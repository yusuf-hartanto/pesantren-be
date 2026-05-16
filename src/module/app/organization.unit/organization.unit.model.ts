'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';
import Cabang from '../cabang/cabang.model';
import LembagaPendidikan, {
  LembagaPendidikanKepesantrenan,
} from '../lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.model';
import LembagaPendidikanFormal from '../lembaga.pendidikan.formal/lembaga.pendidikan.formal.model';

export class OrganizationUnit extends Model {
  declare id_orgunit: string;
  declare nama_orgunit: string;
  declare parent_id: string | null;
  declare level_orgunit: number;
  declare id_cabang: string;
  declare id_lembaga: string | null;
  declare jenis_orgunit: 'Biro' | 'Bagian' | 'Lembaga' | 'Sub-Unit' | 'Umum';
  declare lembaga_type: 'FORMAL' | 'PESANTREN' | null;
  declare keterangan: string;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date | null;

  // Relasi
  declare cabang?: Cabang;
  declare parent?: OrganizationUnit;
  declare children?: OrganizationUnit;
}

export function initOrganizationUnit(sequelize: Sequelize) {
  OrganizationUnit.init(
    {
      id_orgunit: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      nama_orgunit: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      parent_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: { model: 'orgunit', key: 'id_orgunit' },
      },
      level_orgunit: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      id_cabang: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      id_lembaga: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      jenis_orgunit: {
        type: DataTypes.ENUM('Biro', 'Bagian', 'Lembaga', 'Sub-Unit', 'Umum'),
        defaultValue: 'Umum',
      },
      lembaga_type: {
        type: DataTypes.ENUM('FORMAL', 'PESANTREN'),
        allowNull: true,
      },
      keterangan: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'OrganizationUnit',
      tableName: 'orgunit',
      underscored: true, // Otomatis mengubah createdAt jadi created_at
      timestamps: true,
      paranoid: true, // Aktifkan Soft Delete
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  // UUID Otomatis sebelum create
  OrganizationUnit.beforeCreate((organization) => {
    organization?.setDataValue('id_orgunit', uuidv4());
  });

  OrganizationUnit.beforeBulkCreate((organizationInstances) => {
    organizationInstances.forEach((organization) => {
      organization.setDataValue('id_orgunit', uuidv4());
    });
  });

  return OrganizationUnit;
}

export function associateOrganizationUnit() {
  OrganizationUnit.belongsTo(OrganizationUnit, {
    foreignKey: 'parent_id',
    as: 'parent',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  OrganizationUnit.hasMany(OrganizationUnit, {
    foreignKey: 'parent_id',
    as: 'children',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  OrganizationUnit.belongsTo(Cabang, {
    foreignKey: 'id_cabang',
    as: 'cabang',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  OrganizationUnit.belongsTo(LembagaPendidikanFormal, {
    foreignKey: 'id_lembaga',
    as: 'lembagaPendidikanFormal',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  OrganizationUnit.belongsTo(LembagaPendidikanKepesantrenan, {
    foreignKey: 'id_lembaga',
    as: 'lembagaPendidikanKepesantrenan',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export default OrganizationUnit;
