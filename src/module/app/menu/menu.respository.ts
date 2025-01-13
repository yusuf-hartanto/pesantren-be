'use strict';

import { Op } from 'sequelize';
import Model from './menu.model';

export default class Respository {
  public list() {
    return Model.findAll({
      where: { status: { [Op.ne]: 9 } },
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
    if (data?.keyword !== undefined && data?.keyword != null) {
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
export const repository = new Respository();
