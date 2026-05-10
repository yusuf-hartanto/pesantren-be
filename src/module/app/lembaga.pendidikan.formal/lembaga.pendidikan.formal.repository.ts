'use strict';

import { Op } from 'sequelize';
import Model from './lembaga.pendidikan.formal.model';
import Cabang from '../cabang/cabang.model';

export default class Repository {
  public list(data: any) {
    let query: any = {
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Cabang,
          as: 'cabang',
          attributes: ['id_cabang', 'nama_cabang', 'alamat'],
          required: false,
        },
      ],
    };

    const keyword = data?.keyword ? `%${data.keyword}%` : null;
    if (keyword) {
      query.where = {
        nama_lembaga: { [Op.like]: keyword },
      };
    }

    return Model.findAll(query);
  }

  public async index(data: any) {
    let query: any = {
      order: [['created_at', 'DESC']],
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

    const keyword = data?.keyword ? `%${data.keyword}%` : null;

    if (keyword) {
      query.where = {
        [Op.or]: [
          { nama_lembaga: { [Op.like]: keyword } },
          { keterangan: { [Op.like]: keyword } },
          { jenis_lembaga: { [Op.like]: keyword } },
          { nomor_npsn: { [Op.like]: keyword } },
          { '$cabang.nama_cabang$': { [Op.like]: keyword } },
        ],
      };
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
      where: condition,
    });
  }

  public async checkCabangExists(id_cabang: string) {
    const count = await Cabang.count({ where: { id_cabang } });
    return count > 0;
  }

  public async create(data: any) {
    return Model.bulkCreate(data.payload);
  }

  public update(data: any) {
    return Model.update(data?.payload, {
      where: data?.condition,
      individualHooks: true // Penting jika ada hook beforeUpdate
    });
  }

  public delete(data: any) {
    return Model.destroy({
      where: data?.condition,
    });
  }

  public listForExport(condition: any, limit?: number) {
    return Model.findAll({
      where: condition,
      limit: limit,
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
    const existing = await this.findByName(payload.nama_lembaga);

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