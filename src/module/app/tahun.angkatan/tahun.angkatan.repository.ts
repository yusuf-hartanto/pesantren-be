'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './tahun.angkatan.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['id_angkatan', 'DESC']],
    };
    if (data?.tahun_angkatan !== undefined && data?.tahun_angkatan != null) {
      query = {
        ...query,
        where: {
          tahun_angkatan: { [Op.like]: `%${data?.tahun_angkatan}%` },
        },
      };
    }
    return Model.findAll(query);
  }

  public index(data: any) {
    let query: Object = {
      order: [['id_angkatan', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          [Op.or]: [
            { tahun_angkatan: { [Op.like]: `%${data?.keyword}%` } },
            Sequelize.where(
              Sequelize.cast(Sequelize.col('nomor_urut'), 'TEXT'),
              { [Op.like]: `%${data?.keyword}%` }
            ),
            { keterangan: { [Op.like]: `%${data?.keyword}%` } },
          ],
        },
      };
    }
    return Model.findAndCountAll(query);
  }

  public detail(condition: any) {
    return Model.findOne({
      where: {
        ...condition,
      },
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
