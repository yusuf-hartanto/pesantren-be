'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './kebersihan.temuan.model';
import KebersihanInspeksi from '../kebersihan.inspeksi/kebersihan.inspeksi.model';
import Cabang from '../cabang/cabang.model';
import Lokasi from '../location/location.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
    };

    if (data?.id_inspeksi != '') {
      query = {
        ...query,
        where: {
          id_inspeksi: { [Op.eq]: data?.id_inspeksi },
        },
      };
    }

    return Model.findAll({
      ...query,
      include: [],
    });
  }

  public index(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          [Op.or]: [
            { kategori: { [Op.like]: `%${data?.keyword}%` } },
            { deskripsi: { [Op.like]: `%${data?.keyword}%` } },
          ],
        },
      };
    }
    return Model.findAndCountAll({
      ...query,
      include: [],
    });
  }

  public detail(condition: any) {
    return Model.findOne({
      where: {
        ...condition,
      },
      include: [
        {
          model: KebersihanInspeksi,
          as: 'kebersihan_inspeksi',
          required: false,
          attributes: ['id_inspeksi', 'waktu', 'tanggal'],
          include: [
            {
              model: Cabang,
              as: 'cabang',
              required: false,
              attributes: ['id_cabang', 'nama_cabang'],
            },
            {
              model: Lokasi,
              as: 'lokasi',
              required: false,
              attributes: ['id_lokasi', 'nama_lokasi'],
            }
          ]
        },
      ],
    });
  }

  public async create(data: any) {
    return Model.create(data?.payload);
  }

  public update(data: any) {
    return Model.update(data?.payload, {
      where: data?.condition,
      individualHooks: true,
    });
  }

  public delete(data: any) {
    return Model.destroy({
      where: data?.condition,
      individualHooks: true,
    });
  }

  public insert(data: any) {
    return Model.bulkCreate(data);
  }
}

export const repository = new Repository();
