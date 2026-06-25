'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './param.global.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['id', 'DESC']],
    };
    if (data?.param_key !== undefined && data?.param_key != null) {
      query = {
        ...query,
        where: {
          status: { [Op.ne]: 9 },
          param_key: { [Op.like]: `%${data?.param_key}%` },
        },
      };
    }
    return Model.findAll(query);
  }

  public index(data: any) {
    let query: Object = {
      order: [['id', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: {
          status: { [Op.ne]: 9 },
          [Op.or]: [
            Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('param_key')), {
              [Op.like]: keyword,
            }),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('param_value')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('param_desc')),
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
        status: { [Op.ne]: 9 },
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
}

export const repository = new Repository();
