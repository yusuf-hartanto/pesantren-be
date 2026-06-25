'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './role.model';

export default class Repository {
  public list(condition: any = {}) {
    return Model.findAll({
      where: {
        ...condition,
        status: { [Op.ne]: 9 },
      },
      order: [['role_id', 'DESC']],
    });
  }

  public index(data: any) {
    let query: Object = {
      where: {
        status: { [Op.ne]: 9 },
      },
      order: [['role_id', 'DESC']],
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
            Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('role_name')), {
              [Op.like]: keyword,
            }),
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

  public create(data: any) {
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
