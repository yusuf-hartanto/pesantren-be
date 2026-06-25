'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './menu.model';

export default class Repository {
  public list(condition: any = {}, useInclude = false) {
    let include = {};
    if (useInclude) {
      include = {
        include: [
          {
            model: Model,
            as: 'parent',
            required: false,
          },
          {
            model: Model,
            as: 'children',
            required: false,
          },
        ],
      };
    }
    return Model.findAll({
      where: {
        ...condition,
        status: { [Op.ne]: 9 },
      },
      order: [['seq_number', 'ASC']],
      ...include,
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
      distinct: true,
      subQuery: false,
    };
    if (data?.keyword && data?.keyword != undefined) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: {
          status: { [Op.ne]: 9 },
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('AppMenu.menu_name')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('AppMenu.module_name')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('children.menu_name')),
              {
                [Op.like]: keyword,
              }
            ),
          ],
        },
      };
    }
    return Model.findAndCountAll({
      ...query,
      include: [
        {
          model: Model,
          as: 'children',
          required: false,
        },
      ],
    });
  }

  public detail(condition: any) {
    return Model.findOne({
      where: {
        ...condition,
        status: { [Op.ne]: 9 },
      },
      include: [
        {
          model: Model,
          attributes: ['menu_id', 'menu_name', 'status'],
          as: 'parent',
          required: false,
        },
      ],
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
