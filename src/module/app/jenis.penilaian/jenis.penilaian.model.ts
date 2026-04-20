'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';

export class JenisPenilaian extends Model {
  declare id_penilaian: string;
  declare singkatan: string;
  declare jenis_pengujian: string;
  declare lembaga_type: 'FORMAL' | 'PESANTREN';
  declare is_ujian: number;
  declare status: 'active' | 'inactive';
  declare keterangan: string;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date;
}

export function initJenisPenilaian(sequelize: Sequelize) {
  JenisPenilaian.init(
    {
      id_penilaian: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      singkatan: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      jenis_pengujian: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lembaga_type: {
        type: DataTypes.ENUM('FORMAL', 'PESANTREN'),
        allowNull: false,
      },
      is_ujian: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: true,
        defaultValue: 'active',
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'JenisPenilaian',
      tableName: 'jenis_penilaian',
      underscored: true,
      timestamps: true,
      paranoid: true, // Soft delete enabled
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

JenisPenilaian.beforeCreate((jenisPenilaian) => {
    jenisPenilaian?.setDataValue('id_penilaian', uuidv4());
  });

  JenisPenilaian.beforeBulkCreate((jenisPenilaianInstances) => {
    jenisPenilaianInstances.forEach((jenisPenilaian) => {
      jenisPenilaian.setDataValue('id_penilaian', uuidv4()); // Assign a UUID to each instance
    });
  });

  return JenisPenilaian;
}

export default JenisPenilaian;