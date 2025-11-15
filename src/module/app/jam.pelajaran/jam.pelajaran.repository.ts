'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './jam.pelajaran.model';
import JenisJamPelajaran from '../jenis.jampel/jenis.jampel.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['nomor_urut', 'DESC']],
    };
    if (data?.nama_jampel !== undefined && data?.nama_jampel != null) {
      query = {
        ...query,
        where: {
          nama_jampel: { [Op.like]: `%${data?.nama_jampel}%` },
        },
      };
    }
    return Model.findAll({
      ...query,
      include: [
        {
          model: JenisJamPelajaran,
          as: 'jenis_jam_pelajaran',
          required: false,
          attributes: ['nama_jenis_jam', 'keterangan'],
        },
      ],
    });
  }

  public index(data: any) {
    let query: Object = {
      order: [['nomor_urut', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          [Op.or]: [
            { nama_jampel: { [Op.like]: `%${data?.keyword}%` } },
            Sequelize.where(
              Sequelize.cast(Sequelize.col('JamPelajaran.nomor_urut'), 'TEXT'),
              { [Op.like]: `%${data?.keyword}%` }
            ),
            { keterangan: { [Op.like]: `%${data?.keyword}%` } },
            Sequelize.where(
              Sequelize.col('jenis_jam_pelajaran.nama_jenis_jam'),
              { [Op.like]: `%${data?.keyword}%` }
            ),
          ],
        },
      };
    }
    return Model.findAndCountAll({
      ...query,
      include: [
        {
          model: JenisJamPelajaran,
          as: 'jenis_jam_pelajaran',
          required: false,
          attributes: ['nama_jenis_jam', 'keterangan'],
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
          model: JenisJamPelajaran,
          as: 'jenis_jam_pelajaran',
          required: false,
          attributes: ['nama_jenis_jam', 'keterangan'],
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
}

export const repository = new Repository();
