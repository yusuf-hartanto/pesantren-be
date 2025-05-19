'use strict';

import { Op } from 'sequelize';
import Model from './menu.model';

export default class Repository {
  public list() {
    return Model.findAll({
      where: { status: { [Op.ne]: 9 } },
      order: [['seq_number', 'ASC']],
    });
  }

  public allData(condition: any) {
    return Model.findAll({
      where: {
        ...condition,
        status: { [Op.ne]: 9 },
      },
      order: [['seq_number', 'ASC']],
    });
  }

  public index(data: any) {
    let query: Object = {
      where: { status: { [Op.ne]: 9 } },
      order: [['seq_number', 'ASC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          status: { [Op.ne]: 9 },
          [Op.or]: [
            { menu_name: { [Op.like]: `%${data?.keyword}%` } },
            { module_name: { [Op.like]: `%${data?.keyword}%` } },
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
    });
  }
}

export const repository = new Repository();
