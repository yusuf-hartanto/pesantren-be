'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './tingkat.model';
import { getUserContextData } from '../../../context/userContext';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [[Sequelize.fn('LENGTH', Sequelize.col('tingkat')), 'ASC']],
    };

    const userContext = getUserContextData();
    if (userContext && userContext?.lembaga_type) {
      query = { 
        ...query,
        where: { tingkat_type: userContext?.lembaga_type, }
      }
    }

    if (data?.type != '') {
      query = {
        ...query,
        where: {
          tingkat_type: { [Op.eq]: data?.type },
        },
      };
    }
    return Model.findAll(query);
  }

  public index(data: any) {
    let where: any = {};

    // Filter keyword
    if (data?.keyword) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      where[Op.or] = [
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('tingkat')), {
          [Op.like]: keyword,
        }),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(Sequelize.col('nomor_urut'), 'TEXT')
          ),
          {
            [Op.like]: keyword,
          }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(Sequelize.col('tingkat_type'), 'TEXT')
          ),
          {
            [Op.like]: keyword,
          }
        ),
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('keterangan')), {
          [Op.like]: keyword,
        }),
      ];
    }

    // Filter type
    if (data?.type) {
      where.tingkat_type = data.type;
    }

    const userContext = getUserContextData();
    if (userContext && userContext?.lembaga_type) {
      where.tingkat_type = { [Op.eq]: userContext?.lembaga_type, }
    }

    const query: any = {
      order: [['created_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      where,
    };

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
      individualHooks: true,
    });
  }

  public delete(data: any) {
    return Model.destroy({
      where: data?.condition,
      individualHooks: true,
    });
  }
}

export const repository = new Repository();
