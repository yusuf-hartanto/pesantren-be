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
}

export const repository = new Repository();