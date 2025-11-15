'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './status.awal.santri.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['id_statawalsantri', 'DESC']],
    };
    if (data?.kode_statawal !== undefined && data?.kode_statawal != null) {
      query = {
        ...query,
        where: {
          kode_statawal: { [Op.like]: `%${data?.kode_statawal}%` },
        },
      };
    }
    return Model.findAll(query);
  }

  public index(data: any) {
    let query: Object = {
      order: [['id_statawalsantri', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          [Op.or]: [
            { kode_statawal: { [Op.like]: `%${data?.keyword}%` } },
            { nama_statawal: { [Op.like]: `%${data?.keyword}%` } },
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
