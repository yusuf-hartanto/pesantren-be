'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './lembaga.pendidikan.kepesantrenan.model';
import Cabang from '../cabang/cabang.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['id_lembaga', 'DESC']],
      include: [
        {
          model: Cabang,
          as: 'cabang',
          attributes: ['id_cabang', 'nama_cabang', 'alamat'],
          required: false,
        },
      ],
    };

    const keyword = data?.keyword ? `%${data.keyword.toLowerCase()}%` : null;

    if (keyword) {
      query = {
        ...query,
        where: {
          nama_lembaga: Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.col('LembagaPendidikanKepesantrenan.nama_lembaga')
            ),
            { [Op.like]: keyword }
          ),
        },
      };
    }

    return Model.findAll(query);
  }

  public async checkCabangExists(id_cabang: string) {
    return await Cabang.findByPk(id_cabang);
  }

  public async index(data: any) {
    let query: Object = {
      order: [['id_lembaga', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      subQuery: false,
      include: [
        {
          model: Cabang,
          as: 'cabang',
          attributes: ['id_cabang', 'nama_cabang', 'alamat'],
          required: false,
        },
      ],
    };

    const keyword = data?.keyword ? `%${data.keyword.toLowerCase()}%` : null;

    if (keyword) {
      query = {
        ...query,
        where: {
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(
                  Sequelize.col('LembagaPendidikanKepesantrenan.id_lembaga'),
                  'TEXT'
                )
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.col('LembagaPendidikanKepesantrenan.nama_lembaga')
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(
                  Sequelize.col('LembagaPendidikanKepesantrenan.keterangan'),
                  'TEXT'
                )
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('cabang.nama_cabang')),
              { [Op.like]: keyword }
            ),
          ],
        },
      };

      return await Model.findAndCountAll(query);
    }

    return Model.findAndCountAll(query);
  }

  public detail(condition: any) {
    return Model.findOne({
      include: [
        {
          model: Cabang,
          as: 'cabang',
          attributes: ['id_cabang', 'nama_cabang', 'alamat'],
          required: false,
        },
      ],
      where: {
        ...condition,
      },
    });
  }

  public async create(data: any) {
    return Model.bulkCreate(data.payload);
  }

  public update(data: any) {
    return Model.update(data?.payload, {
      where: data?.condition,
    });
  }

  public delete(data: any) {
    return Model.destroy({
      where: data?.condition,
    });
  }

  public async listForExport(params: {
    q?: string;
    isTemplate?: boolean;
    limit?: number;
  }) {
    const { q, isTemplate, limit } = params;
    const keyword = q ? `%${q.toLowerCase()}%` : null;

    let whereClause: any = {};

    if (!isTemplate && keyword) {
      whereClause = {
        [Op.or]: [
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.col('LembagaPendidikanKepesantrenan.nama_lembaga')
            ),
            { [Op.like]: keyword }
          ),
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(
                Sequelize.col('LembagaPendidikanKepesantrenan.keterangan'),
                'TEXT'
              )
            ),
            { [Op.like]: keyword }
          ),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('cabang.nama_cabang')),
            { [Op.like]: keyword }
          ),
        ],
      };
    }

    return Model.findAll({
      where: whereClause,
      limit: limit || (isTemplate ? 5 : undefined),
      include: [
        {
          model: Cabang,
          as: 'cabang',
          attributes: ['nama_cabang'],
        },
      ],
      order: [['nama_lembaga', 'ASC']],
    });
  }

  public findByName(name: string) {
    return Model.findOne({
      where: Model.sequelize?.where(
        Model.sequelize.fn('LOWER', Model.sequelize.col('nama_lembaga')),
        name.toLowerCase().trim()
      ),
    });
  }

  public async upsertImport(payload: any, transaction: any = null) {
    const existing = await this.findByName(payload.nama_lembaga);

    if (existing) {
      return await existing.update(payload, { transaction });
    } else {
      return await Model.create(payload, { transaction });
    }
  }

  public async insertImport(payloads: any[]) {
    const trx = await Model.sequelize?.transaction();
    try {
      for (const item of payloads) {
        await this.upsertImport(item, trx);
      }
      await trx?.commit();
    } catch (error) {
      await trx?.rollback();
      throw error;
    }
  }
}

export const repository = new Repository();
