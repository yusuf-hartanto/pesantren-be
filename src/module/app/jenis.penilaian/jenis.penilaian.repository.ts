'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './jenis.penilaian.model';

export default class Repository {
  public async checkDuplicateCombination(
    singkatan: string | null,
    jenisPengujian: string,
    lembagaType: string,
    excludeId?: string
  ) {
    const where: any = {
      singkatan: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('JenisPenilaian.singkatan')),
        singkatan ? singkatan.trim().toLowerCase() : ''
      ),
      jenis_pengujian: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('JenisPenilaian.jenis_pengujian')),
        jenisPengujian.trim().toLowerCase()
      ),
      lembaga_type: lembagaType,
    };
    if (excludeId) {
      where.id_penilaian = { [Op.ne]: excludeId };
    }
    return await Model.findOne({ where });
  }

  public list(data: any) {
    let query: any = {
      order: [['id_penilaian', 'DESC']],
      where: {},
    };

    if (data?.singkatan) {
      query.where.singkatan = { [Op.like]: `%${data.singkatan}%` };
    }

    if (data?.lembaga_type) {
      query.where.lembaga_type = data.lembaga_type;
    }

    return Model.findAll(query);
  }

  public async index(data: any) {
    const query: any = {
      order: [['created_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      subQuery: false,
      where: {},
    };

    const keyword = data?.keyword ? `%${data.keyword.toLowerCase()}%` : null;

    if (keyword) {
      query.where[Op.or] = [
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.col('JenisPenilaian.jenis_pengujian')
          ),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('JenisPenilaian.singkatan')),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(Sequelize.col('JenisPenilaian.lembaga_type'), 'text')
          ),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(Sequelize.col('JenisPenilaian.status'), 'text')
          ),
          { [Op.like]: keyword }
        ),
      ];
    }

    return await Model.findAndCountAll(query);
  }

  public detail(condition: any) {
    return Model.findOne({
      where: { ...condition },
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

  public findByName(name: string, type?: string | null) {
    return Model.findOne({
      where: {
        singkatan: Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('JenisPenilaian.singkatan')),
          name.trim().toLowerCase()
        ),
        ...(type && { lembaga_type: type }),
      },
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
      whereClause[Op.or] = [
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.col('JenisPenilaian.jenis_pengujian')
          ),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('JenisPenilaian.singkatan')),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(Sequelize.col('JenisPenilaian.lembaga_type'), 'text')
          ),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(Sequelize.col('JenisPenilaian.status'), 'text')
          ),
          { [Op.like]: keyword }
        ),
      ];
    }

    return Model.findAll({
      where: whereClause,
      limit: limit || (isTemplate ? 5 : undefined),
      subQuery: false,
      order: [['jenis_pengujian', 'ASC']],
    });
  }

  public async insertImport(payloads: any[]) {
    const trx = await Model.sequelize?.transaction();
    try {
      for (const item of payloads) {
        const existing = await Model.findOne({
          where: {
            singkatan: Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('JenisPenilaian.singkatan')),
              item.singkatan.trim().toLowerCase()
            ),
            jenis_pengujian: Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.col('JenisPenilaian.jenis_pengujian')
              ),
              item.jenis_pengujian.trim().toLowerCase()
            ),
            lembaga_type: item.lembaga_type,
          },
        });

        if (existing) {
          await existing.update(item, { transaction: trx });
        } else {
          await Model.create(item, { transaction: trx });
        }
      }
      await trx?.commit();
      return true;
    } catch (error) {
      await trx?.rollback();
      throw error;
    }
  }
}

export const repository = new Repository();
