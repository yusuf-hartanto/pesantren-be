'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './orang.tua.wali.model';
//import Santri from '../santri/santri.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
    };
    if (data?.nama_wali !== undefined && data?.nama_wali != null) {
      query = {
        ...query,
        where: {
          nama_wali: { [Op.like]: `%${data?.nama_wali}%` },
        },
      };
    }
    return Model.findAll({
      ...query,
      include: [
        // {
        //   model: Santri,
        //   as: 'santri',
        //   required: true,
        //   attributes: ['nama_santri'],
        // }
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
            { nama_wali: { [Op.like]: `%${data?.keyword}%` } },
            // Sequelize.where(Sequelize.col('santri.nama_santri'), {
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
        //   model: Santri,
        //   as: 'santri',
        //   required: false,
        //   attributes: ['nama_santri'],
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
        //   model: Santri,
        //   as: 'santri',
        //   required: true,
        //   attributes: ['nama_santri'],
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
    });
  }

  public delete(data: any) {
    return Model.destroy({
      where: data?.condition,
    });
  }
}

export const repository = new Repository();
