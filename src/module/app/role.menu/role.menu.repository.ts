'use strict';

import { Op } from 'sequelize';
import Model from './role.menu.model';
import Role from '../role/role.model';
import Menu from '../menu/menu.model';

export default class Repository {
  public list() {
    return Role.findAll({
      where: {
        status: { [Op.ne]: 9 },
      },
      order: [['role_id', 'DESC']],
      include: [
        {
          model: Model,
          as: 'role_menu',
          required: false,
          include: [
            {
              model: Menu,
              as: 'menu',
              required: true,
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
      group: 'AppRole.role_id',
      include: [
        {
          model: Model,
          as: 'role_menu',
          required: false,
          include: [
            {
              model: Menu,
              as: 'menu',
              required: true,
              where: {
                status: { [Op.ne]: 9 },
              },
            },
          ],
        },
      ],
    };
    if (data?.keyword && data?.keyword != undefined) {
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
          as: 'role_menu',
          required: false,
          include: [
            {
              model: Menu,
              as: 'menu',
              required: true,
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

export const repository = new Repository();
