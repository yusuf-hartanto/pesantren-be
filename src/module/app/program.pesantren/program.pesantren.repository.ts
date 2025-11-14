'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './program.pesantren.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['id_program', 'DESC']],
    };
    if (data?.nama_program !== undefined && data?.nama_program != null) {
      query = {
        ...query,
        where: {
          nama_program: { [Op.like]: `%${data?.nama_program}%` },
        },
      };
    }
    return Model.findAll(query);
  }

  public index(data: any) {
    let query: Object = {
      order: [['id_program', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          [Op.or]: [
            { nama_program: { [Op.like]: `%${data?.keyword}%` } },
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
