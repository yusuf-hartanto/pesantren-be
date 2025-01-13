'use strict';

import { Op } from 'sequelize';
import Model from './role.menu.model';
import Role from '../role/role.model';
import Menu from '../menu/menu.model';

export default class Respository {
  public list() {
    return Role.findAll({
      where: {
        status: { [Op.ne]: 9 },
      },
      order: [['role_id', 'DESC']],
      include: [
        {
          model: Model,
          as: 'menu',
          required: false,
          include: [
            {
              model: Menu,
              as: 'menu',
              required: false,
              where: {
                status: { [Op.ne]: 9 },
              },
            },
          ],
        },
      ],
    });
  }

  public index(data: any) {
    let query: Object = {
      order: [['role_id', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      group: 'app_role.role_id',
      include: [
        {
          model: Model,
          as: 'menu',
          required: false,
          include: [
            {
              model: Menu,
              as: 'menu',
              required: false,
              where: {
                status: { [Op.ne]: 9 },
              },
            },
          ],
        },
      ],
    };
    if (data?.keyword !== undefined && data?.keyword != null) {
      query = {
        ...query,
        where: {
          status: { [Op.ne]: 9 },
          role_name: { [Op.like]: `%${data?.keyword}%` },
        },
      };
    }
    return Role.findAndCountAll(query);
  }

  public detail(condition: any) {
    return Model.findOne({
      where: {
        ...condition,
        status: { [Op.ne]: 9 },
      },
    });
  }

  public detailRole(condition: any) {
    return Role.findOne({
      where: {
        ...condition,
        status: { [Op.ne]: 9 },
      },
      include: [
        {
          model: Model,
          as: 'menu',
          required: false,
          include: [
            {
              model: Menu,
              as: 'menu',
              required: false,
              where: {
                status: { [Op.ne]: 9 },
              },
            },
          ],
        },
      ],
    });
  }

  public bulkCreate(data: any) {
    return Model.bulkCreate(data?.payload);
  }

  public delete(data: any) {
    return Model.destroy({
      where: data?.condition,
    });
  }
}

export const repository = new Respository();
