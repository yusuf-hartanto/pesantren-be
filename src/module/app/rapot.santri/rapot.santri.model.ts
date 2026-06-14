'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import Santri from '../santri/santri.model';
import AppResource from '../resource/resource.model';

export class RapotSantri extends Model {
  declare id_rapot: string;
  declare id_santri: string;
  declare tahun_ajaran: string;
  declare semester: string;
  declare file_rapot: string;
  declare status: 'Aktif' | 'Arsip';
  declare created_by: string;
  declare updated_by: string | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;

  // Eager loading relations type definition
  declare santri?: Santri;
  declare creator?: AppResource;
  declare updater?: AppResource;
}

export function initRapotSantri(sequelize: Sequelize) {
  RapotSantri.init(
    {
      id_rapot: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_santri: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tahun_ajaran: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      semester: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_rapot: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('Aktif', 'Arsip'),
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
      modelName: 'RapotSantri',
      tableName: 'rapot_santri',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  RapotSantri.beforeCreate((rapot) => {
    rapot?.setDataValue('id_rapot', uuidv4());
  });

  return RapotSantri;
}

export function associateRapotSantri() {
  RapotSantri.belongsTo(Santri, {
    foreignKey: 'id_santri',
    as: 'santri',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  RapotSantri.belongsTo(AppResource, {
    foreignKey: 'created_by',
    targetKey: 'resource_id',
    as: 'creator',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  RapotSantri.belongsTo(AppResource, {
    foreignKey: 'updated_by',
    targetKey: 'resource_id',
    as: 'updater',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export default RapotSantri;
