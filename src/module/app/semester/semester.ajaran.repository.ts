'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './semester.ajaran.model';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['id_semester', 'DESC']],
    };
    if (data?.nama_semester !== undefined && data?.nama_semester != null) {
      query = {
        ...query,
        where: {
          nama_semester: { [Op.like]: `%${data?.nama_semester}%` },
        },
      };
    }
    return Model.findAll({
      ...query,
      include: [
        {
          model: TahunAjaran,
          as: 'tahun_ajaran',
          required: true,
          attributes: ['tahun_ajaran'],
        },
      ],
    });
  }

  public index(data: any) {
    let query: Object = {
      order: [['id_semester', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          [Op.or]: [
            { nama_semester: { [Op.like]: `%${data?.keyword}%` } },
            Sequelize.where(
              Sequelize.cast(Sequelize.col("nomor_urut"), "TEXT"),
              { [Op.like]: `%${data?.keyword}%` }
            ),
            { keterangan: { [Op.like]: `%${data?.keyword}%` } },
          ],
        },
      };
    }
    return Model.findAndCountAll({
      ...query,
      include: [
        {
          model: TahunAjaran,
          as: 'tahun_ajaran',
          required: true,
          attributes: ['tahun_ajaran'],
        },
      ],
    });
  }

  public detail(condition: any) {
    return Model.findOne({
      where: {
        ...condition,
      },
      include: [
        {
          model: TahunAjaran,
          as: 'tahun_ajaran',
          required: true,
          attributes: ['tahun_ajaran'],
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
    });
  }

  public delete(data: any) {
    return Model.destroy({
      where: data?.condition,
    });
  }
}

export const repository = new Repository();
