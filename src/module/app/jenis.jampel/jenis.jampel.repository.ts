'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './jenis.jampel.model';

export default class Repository {
  public list(condition: any) {
    return Model.findAll({
      where: condition,
      order: [['updated_at', 'DESC']],
    });
  }

  public index(data: any) {
    let query: any = {
      order: [['updated_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: {
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('nama_jenis_jam')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('keterangan')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(Sequelize.col('lembaga_type'), 'TEXT')
              ),
              {
                [Op.like]: keyword,
              }
            ),
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
