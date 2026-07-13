'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize, Op } from 'sequelize';
import moment from 'moment';
import Cabang from '../cabang/cabang.model';
import Institution from '../institution/institution.model';

export class LembagaPendidikanFormal extends Model {
  declare id_lembaga: string;
  declare nama_lembaga: string;
  declare id_cabang: string | null;
  declare keterangan: string;
  declare jenis_lembaga: string;
  declare status_akreditasi: string;
  declare nomor_npsn: string;
  declare institution_id_sitrendi: string;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null; // Tambahkan properti deleted_at

  // Relasi
  declare cabang?: Cabang;
}

export function initLembagaPendidikanFormal(sequelize: Sequelize) {
  LembagaPendidikanFormal.init(
    {
      id_lembaga: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      nama_lembaga: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      id_cabang: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      keterangan: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      jenis_lembaga: {
        type: DataTypes.ENUM(
          'SD',
          'MI',
          'SMP',
          'MTs',
          'SMA',
          'MA',
          'SMK',
          'Diniyah',
          'Perguruan Tinggi'
        ),
        allowNull: true,
      },
      status_akreditasi: {
        type: DataTypes.ENUM('A', 'B', 'C', 'Belum Terakreditasi'),
        allowNull: true,
      },
      nomor_npsn: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      institution_id_sitrendi: {
        type: DataTypes.STRING,
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
      // 1. Tambahkan kolom deleted_at
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
          const value = this.getDataValue('deleted_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
    },
    {
      sequelize,
      modelName: 'LembagaPendidikanFormal',
      tableName: 'lembaga_pendidikan_formal',
      // 2. Aktifkan timestamps dan paranoid
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  // UUID Otomatis
  LembagaPendidikanFormal.beforeCreate((lembaga) => {
    if (!lembaga.id_lembaga) {
      lembaga.setDataValue('id_lembaga', uuidv4());
    }
  });

  LembagaPendidikanFormal.beforeBulkCreate((lembagaInstances) => {
    lembagaInstances.forEach((lembaga) => {
      if (!lembaga.id_lembaga) {
        lembaga.setDataValue('id_lembaga', uuidv4());
      }
    });
  });

  async function syncSantriRelations(lembaga: LembagaPendidikanFormal, transaction: any) {
    if (!lembaga.institution_id_sitrendi) return;

    try {
      const AppSantri = require('../santri/santri.model').default;
      const CabangModel = require('../cabang/cabang.model').default;
      const InstituionModel = require('../institution/institution.model').default;

      let payload: any = {
        id_cabang: lembaga.id_cabang,
        id_lembaga_formal: lembaga.id_lembaga,
      }

      if (lembaga.id_cabang) {
        const cabang = await CabangModel.findOne({
          where: { id_cabang: lembaga.id_cabang },
          attributes: ['nama_cabang'],
          transaction,
        });
        if (cabang && cabang?.nama_cabang) payload.nama_cabang = cabang?.nama_cabang;
      }

      if (lembaga.institution_id_sitrendi) {
        const institution = await InstituionModel.findOne({
          where: { institution_id_sitrendi: lembaga.institution_id_sitrendi },
          attributes: ['id_institution', 'institution_name'],
          transaction,
        });
        if (institution && institution?.id_institution) {
          payload.id_institution = institution?.id_institution;
        }
        if (institution && institution?.institution_name) {
          payload.institution_name = institution?.institution_name;
        }
      }

      await AppSantri.update(payload,
        {
          where: {
            institution_id_sitrendi: lembaga.institution_id_sitrendi,
            status: { [Op.ne]: 9 },
          },
          transaction,
        }
      );
    } catch (err: any) {
      console.error(`Error syncing santri relations on Lembaga change: ${err.message}`);
    }
  }

  LembagaPendidikanFormal.afterCreate(async (lembaga, options) => {
    await syncSantriRelations(lembaga, options.transaction);
  });

  LembagaPendidikanFormal.afterUpdate(async (lembaga, options) => {
    await syncSantriRelations(lembaga, options.transaction);
  });

  LembagaPendidikanFormal.afterBulkCreate(async (lembagaInstances, options) => {
    for (const lembaga of lembagaInstances) {
      await syncSantriRelations(lembaga, options.transaction);
    }
  });

  return LembagaPendidikanFormal;
}

export function associateLembagaPendidikanFormal() {
  LembagaPendidikanFormal.belongsTo(Cabang, {
    foreignKey: 'id_cabang',
    as: 'cabang',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
  LembagaPendidikanFormal.belongsTo(Institution, {
    foreignKey: 'institution_id_sitrendi',
    targetKey: 'institution_id_sitrendi',
    as: 'institution',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export default LembagaPendidikanFormal;
