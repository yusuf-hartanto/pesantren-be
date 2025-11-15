'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './asrama.model';
//import Cabang from '../cabang/cabang.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
    };
    if (data?.nama_asrama !== undefined && data?.nama_asrama != null) {
      query = {
        ...query,
        where: {
          nama_asrama: { [Op.like]: `%${data?.nama_asrama}%` },
        },
      };
    }
    return Model.findAll({
      ...query,
      include: [
        // {
        //   model: Cabang,
        //   as: 'cabang',
        //   required: true,
        //   attributes: ['nama_cabang'],
        // },
      ],
    });
  }

  public index(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          [Op.or]: [
            { nama_asrama: { [Op.like]: `%${data?.keyword}%` } },
            { keterangan: { [Op.like]: `%${data?.keyword}%` } },
            // Sequelize.where(Sequelize.col('cabang.nama_cabang'), {
            //   [Op.like]: `%${data?.keyword}%`,
            // }),
          ],
        },
      };
    }
    return Model.findAndCountAll({
      ...query,
      include: [
        // {
        //   model: Cabang,
        //   as: 'cabang',
        //   required: false,
        //   attributes: ['nama_cabang'],
        // },
      ],
    });
  }

  public detail(condition: any) {
    return Model.findOne({
      where: {
        ...condition,
      },
      include: [
        // {
        //   model: Cabang,
        //   as: 'cabang',
        //   required: true,
        //   attributes: ['nama_cabang'],
        // },
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
}

export const repository = new Repository();
