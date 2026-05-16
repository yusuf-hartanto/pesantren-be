'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';
import JenisPenilaian from '../jenis.penilaian/jenis.penilaian.model';
import Tingkat from '../tingkat/tingkat.model';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';
import LembagaPendidikanFormal from '../lembaga.pendidikan.formal/lembaga.pendidikan.formal.model';
import LembagaPendidikanKepesantrenan from '../lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.model';

export class JenisPenilaianBobot extends Model {
  declare id_bobot: string;
  declare id_penilaian: string;
  declare lembaga_type: 'FORMAL' | 'PESANTREN';
  declare id_lembaga: string;
  declare id_tingkat: string | null;
  declare id_tahunajaran: string;
  declare bobot: number; // Gunakan number untuk DECIMAL
  declare status: 'Aktif' | 'Nonaktif';

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date | null;

  // Relasi
  declare readonly jenisPenilaian?: JenisPenilaian;
  declare readonly tingkat?: Tingkat;
  declare readonly tahunAjaran?: TahunAjaran;
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
        references: { model: 'jenis_penilaian', key: 'id_penilaian' },
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
        references: { model: 'tingkat', key: 'id_tingkat' },
      },
      id_tahunajaran: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'tahun_ajaran', key: 'id_tahunajaran' },
      },
      bobot: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        get() {
          // Mengonversi string decimal dari DB ke float agar enak dipakai di Frontend
          const value = this.getDataValue('bobot');
          return value ? parseFloat(value) : 0;
        },
      },
      status: {
        type: DataTypes.ENUM('Aktif', 'Nonaktif'),
        allowNull: false,
        defaultValue: 'Aktif',
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
      modelName: 'JenisPenilaianBobot',
      tableName: 'jenis_penilaian_bobot',
      underscored: true, // Otomatis mengelola created_at & updated_at
      timestamps: true,
      paranoid: true, // Soft delete
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
    as: 'jenisPenilaian',
  });

  JenisPenilaianBobot.belongsTo(Tingkat, {
    foreignKey: 'id_tingkat',
    as: 'tingkat',
  });

  JenisPenilaianBobot.belongsTo(TahunAjaran, {
    foreignKey: 'id_tahunajaran',
    as: 'tahunAjaran',
  });

  JenisPenilaianBobot.belongsTo(LembagaPendidikanFormal, {
    foreignKey: 'id_lembaga',
    as: 'lembagaPendidikanFormal',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  JenisPenilaianBobot.belongsTo(LembagaPendidikanKepesantrenan, {
    foreignKey: 'id_lembaga',
    as: 'lembagaPendidikanKepesantrenan',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export default JenisPenilaianBobot;
