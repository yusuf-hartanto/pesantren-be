'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './master.slot.waktu.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['jam_mulai', 'ASC']],
    };

    if (data?.is_active != '') {
      query = {
        ...query,
        where: {
          is_active: data?.is_active == 'true',
        },
      };
    }

    return Model.findAll({
      ...query,
      include: [],
    });
  }

  public index(data: any) {
    let where: any = {};

    // Filter keyword
    if (data?.keyword) {
      where[Op.or] = [
        { kode_slot: { [Op.like]: `%${data?.keyword}%` } },
        { keterangan: { [Op.like]: `%${data?.keyword}%` } },
      ];
    }

    // Filter status
    if (data?.status) {
      where.is_active = data.status == 'Ya';
    }

    let query: Object = {
      order: [['kode_slot', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      where,
    };

    return Model.findAndCountAll({
      ...query,
      include: [],
    });
  }

  public detail(condition: any) {
    return Model.findOne({
      where: {
        ...condition,
      },
      include: [],
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
