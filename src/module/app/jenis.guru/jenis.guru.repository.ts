'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './jenis.guru.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['nomor_urut', 'DESC']],
    };
    if (data?.nama_jenis_guru !== undefined && data?.nama_jenis_guru != null) {
      query = {
        ...query,
        where: {
          nama_jenis_guru: { [Op.like]: `%${data?.nama_jenis_guru}%` },
        },
      };
    }
    return Model.findAll(query);
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
            { nama_jenis_guru: { [Op.like]: `%${data?.keyword}%` } },
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
    });
  }

  public delete(data: any) {
    return Model.destroy({
      where: data?.condition,
    });
  }
}

export const repository = new Repository();
