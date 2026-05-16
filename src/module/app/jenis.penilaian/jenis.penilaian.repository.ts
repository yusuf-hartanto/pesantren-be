'use strict';

import { Op } from 'sequelize';
import Model from './jenis.penilaian.model';

export default class Repository {
  /**
   * Cek duplikasi jenis_pengujian berdasarkan lembaga_type
   */
  public async checkDuplicate(
    jenis_pengujian: string,
    lembaga_type: string,
    excludeId?: string
  ) {
    const where: any = {
      jenis_pengujian,
      lembaga_type,
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

  public index(data: any) {
    let query: any = {
      order: [['id_penilaian', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      where: {},
    };
    console.log('KEYWORD', data);
    if (data?.keyword) {
      query.where[Op.or] = [
        { singkatan: { [Op.iLike]: `%${data.keyword}%` } },
        { jenis_pengujian: { [Op.iLike]: `%${data.keyword}%` } },
        { keterangan: { [Op.iLike]: `%${data.keyword}%` } },
      ];
    }

    return Model.findAndCountAll(query);
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
        singkatan: {
          [Op.iLike]: name.trim(),
        },
        ...(type && { lembaga_type: type }),
      },
    });
  }

  public async insertImport(payloads: any[]) {
    const trx = await Model.sequelize?.transaction();

    try {
      for (const item of payloads) {
        await this.upsertImport(item, trx);
      }

      if (trx) await trx.commit();
      return true;
    } catch (error) {
      if (trx) await trx.rollback();
      throw error;
    }
  }

  public async upsertImport(payload: any, transaction: any = null) {
    const existing = await this.findByName(
      payload.singkatan,
      payload.lembaga_type
    );

    if (existing) {
      return await existing.update(
        {
          ...payload,
        },
        { transaction }
      );
    } else {
      return await Model.create(
        {
          ...payload,
        },
        { transaction }
      );
    }
  }
}

export const repository = new Repository();
