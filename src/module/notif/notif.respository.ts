'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './notif.model';
import Resource from '../app/resource/resource.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['created_date', 'DESC']],
    };
    if (data?.messae !== undefined && data?.messae != null) {
      query = {
        ...query,
        where: {
          messae: { [Op.like]: `%${data?.messae}%` },
        },
      };
    }
    return Model.findAll({
      ...query,
      include: [
        {
          model: Resource,
          as: 'resource',
          required: false,
          attributes: ['full_name', 'email'],
        },
      ],
    });
  }

  public index(data: any) {
    let query: Object = {
      order: [['created_date', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          [Op.or]: [
            { message: { [Op.like]: `%${data?.keyword}%` } },
            Sequelize.where(Sequelize.col('resource.full_name'), {
              [Op.like]: `%${data?.keyword}%`,
            }),
          ],
        },
      };
    }
    return Model.findAndCountAll({
      ...query,
      include: [
        {
          model: Resource,
          as: 'resource',
          required: false,
          attributes: ['full_name', 'email'],
        },
      ],
    });
  }

  public detail(condition: any) {
    return Model.findOne({
      where: {
        ...condition,
      },
      include: [
        {
          model: Resource,
          as: 'resource',
          required: false,
          attributes: ['full_name', 'email'],
        },
      ],
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
