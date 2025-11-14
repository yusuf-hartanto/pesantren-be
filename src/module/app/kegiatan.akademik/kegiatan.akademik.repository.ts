'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './kegiatan.akademik.model';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';
import Semester from '../semester/semester.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
    };
    if (data?.nama_kegiatan !== undefined && data?.nama_kegiatan != null) {
      query = {
        ...query,
        where: {
          nama_kegiatan: { [Op.like]: `%${data?.nama_kegiatan}%` },
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
        {
          model: Semester,
          as: 'semester',
          required: true,
          attributes: ['nama_semester'],
        },
      ],
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
            { nama_kegiatan: { [Op.like]: `%${data?.keyword}%` } },
            { keterangan: { [Op.like]: `%${data?.keyword}%` } },
            Sequelize.where(Sequelize.col('tahun_ajaran.tahun_ajaran'), {
              [Op.like]: `%${data?.keyword}%`,
            }),
            Sequelize.where(Sequelize.col('semester.nama_semester'), {
              [Op.like]: `%${data?.keyword}%`,
            }),
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
          required: false,
          attributes: ['tahun_ajaran'],
        },
        {
          model: Semester,
          as: 'semester',
          required: false,
          attributes: ['nama_semester'],
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
        {
          model: Semester,
          as: 'semester',
          required: true,
          attributes: ['nama_semester'],
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
