'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';
import JenisPenilaian from '../jenis.penilaian/jenis.penilaian.model';
import Tingkat from '../tingkat/tingkat.model';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';

export class JenisPenilaianBobot extends Model {
  public id_bobot!: string;
  public id_penilaian!: string;
  public lembaga_type!: 'FORMAL' | 'PESANTREN';
  public id_lembaga!: string;
  public id_tingkat!: string | null;
  public id_tahunajaran!: string;
  public bobot!: number; // Gunakan number untuk DECIMAL
  public status!: 'Aktif' | 'Nonaktif';
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date | null;

  // Relasi
  public readonly jenisPenilaian?: JenisPenilaian;
  public readonly tingkat?: Tingkat;
  public readonly tahunAjaran?: TahunAjaran;
}

export function initJenisPenilaianBobot(sequelize: Sequelize) {
  JenisPenilaianBobot.init(
    {
      id_bobot: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      id_penilaian: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'jenis_penilaian', key: 'id_penilaian' }
      },
      lembaga_type: {
        type: DataTypes.ENUM('FORMAL', 'PESANTREN'),
        allowNull: false,
      },
      id_lembaga: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      id_tingkat: {
        type: DataTypes.STRING,
        allowNull: true,
        references: { model: 'tingkat', key: 'id_tingkat' }
      },
      id_tahunajaran: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'tahun_ajaran', key: 'id_tahunajaran' }
      },
      bobot: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        get() {
          // Mengonversi string decimal dari DB ke float agar enak dipakai di Frontend
          const value = this.getDataValue('bobot');
          return value ? parseFloat(value) : 0;
        }
      },
      status: {
        type: DataTypes.ENUM('Aktif', 'Nonaktif'),
        allowNull: false,
        defaultValue: 'Aktif'
      },
      created_at: {
        type: DataTypes.DATE,
        get() {
          const value = this.getDataValue('created_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        }
      },
      updated_at: {
        type: DataTypes.DATE,
        get() {
          const value = this.getDataValue('updated_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        }
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      }
    },
    {
      sequelize,
      modelName: 'JenisPenilaianBobot',
      tableName: 'jenis_penilaian_bobot',
      underscored: true, // Otomatis mengelola created_at & updated_at
      timestamps: true,
      paranoid: true,    // Soft delete
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  JenisPenilaianBobot.beforeCreate((instance) => {
    if (!instance.id_bobot) instance.setDataValue('id_bobot', uuidv4());
  });

  JenisPenilaianBobot.beforeBulkCreate((instances) => {
    instances.forEach((instance) => {
      if (!instance.id_bobot) instance.setDataValue('id_bobot', uuidv4());
    });
  });

  return JenisPenilaianBobot;
}

export function associateJenisPenilaianBobot() {
  JenisPenilaianBobot.belongsTo(JenisPenilaian, {
    foreignKey: 'id_penilaian',
    as: 'jenisPenilaian'
  });

  JenisPenilaianBobot.belongsTo(Tingkat, {
    foreignKey: 'id_tingkat',
    as: 'tingkat'
  });

  JenisPenilaianBobot.belongsTo(TahunAjaran, {
    foreignKey: 'id_tahunajaran',
    as: 'tahunAjaran'
  });
}

export default JenisPenilaianBobot;