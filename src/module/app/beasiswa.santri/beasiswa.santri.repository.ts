'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './beasiswa.santri.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['id_beasiswasantri', 'DESC']],
    };
    if (data?.kode_beasiswa !== undefined && data?.kode_beasiswa != null) {
      query = {
        ...query,
        where: {
          kode_beasiswa: { [Op.like]: `%${data?.kode_beasiswa}%` },
        },
      };
    }
    return Model.findAll(query);
  }

  public index(data: any) {
    let query: Object = {
      order: [['id_beasiswasantri', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          [Op.or]: [
            { kode_beasiswa: { [Op.like]: `%${data?.keyword}%` } },
            { nama_beasiswa: { [Op.like]: `%${data?.keyword}%` } },
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
