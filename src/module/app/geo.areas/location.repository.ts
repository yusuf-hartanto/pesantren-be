'use strict';

import { Op } from 'sequelize';
import Model from './geo.areas.model';

export default class Repository {
  public list(data: any) {
    let query: any = {
      order: [['id_lokasi', 'DESC']],
      include: [
        {
          model: Model,
          as: 'parent',
          attributes: ['id_lokasi', 'nama_lokasi'],
          required: false,
        },
      ],
    };

    const keyword = data?.keyword ? `%${data.keyword}%` : null;

    if (keyword) {
      query.where = {
        nama_lokasi: { [Op.like]: keyword },
      };
    }

    return Model.findAll(query);
  }

  public async index(data: any) {
    let query: any = {
      order: [['id_lokasi', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      subQuery: false,
      include: [
        {
          model: Model,
          as: 'parent',
          attributes: ['id_lokasi', 'nama_lokasi'],
          required: false,
        },
      ],
    };

    const keyword = data?.keyword ? `%${data.keyword}%` : null;

    if (keyword) {
      query.where = {
        [Op.or]: [
          { nama_lokasi: { [Op.like]: keyword } },
          { jenis_lokasi: { [Op.like]: keyword } },
          { kode_lokasi: { [Op.like]: keyword } },
          { keterangan: { [Op.like]: keyword } },
          // Filter berdasarkan nama parent-nya
          { '$parent.nama_lokasi$': { [Op.like]: keyword } },
        ],
      };
    }

    return Model.findAndCountAll(query);
  }

  public detail(condition: any) {
    return Model.findOne({
      include: [
        {
          model: Model,
          as: 'parent',
          attributes: ['id_lokasi', 'nama_lokasi'],
          required: false,
        },
        {
          model: Model,
          as: 'sub_lokasi', // Menampilkan list ruangan di dalamnya jika ada
          required: false,
        }
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
}

export const repository = new Repository();