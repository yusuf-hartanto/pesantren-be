'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './notification.model';
import AppResource from '../resource/resource.model';

export default class Repository {
  public index(data: any) {
    let where: any = {};
    
    if (data?.resource_id) {
      where.to = data.resource_id;
    }

    if (data?.keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${data?.keyword}%` } },
        { message: { [Op.like]: `%${data?.keyword}%` } },
      ];
    }

    let query: Object = {
      order: [['created_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      where,
    };
    
    return Model.findAndCountAll({
      ...query,
      include: [
        {
          model: AppResource,
          as: 'sender',
          required: false,
          attributes: ['resource_id', 'username', 'full_name'],
        },
        {
          model: AppResource,
          as: 'receiver',
          required: false,
          attributes: ['resource_id', 'username', 'full_name'],
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
          model: AppResource,
          as: 'sender',
          required: false,
          attributes: ['resource_id', 'username', 'full_name'],
        },
        {
          model: AppResource,
          as: 'receiver',
          required: false,
          attributes: ['resource_id', 'username', 'full_name'],
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
      individualHooks: true,
    });
  }

  public delete(data: any) {
    return Model.destroy({
      where: data?.condition,
      individualHooks: true,
    });
  }

  public async insert(data: any) {
    return Model.bulkCreate(data);
  }
}

export const repository = new Repository();
