'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './kelompok.pelajaran.model';

export default class Repository {
  public list(condition: any, useInclude = false) {
    let include = {};
    if (useInclude) {
      include = {
        include: [
          {
            model: Model,
            as: 'children',
            required: false,
          },
          {
            model: Model,
            as: 'parent',
            required: false,
          },
        ],
      };
    }
    return Model.findAll({
      where: condition,
      order: [['updated_at', 'DESC']],
      ...include,
    });
  }

  public index(data: any) {
    let query: any = {
      where: {
        parent_id: {
          [Op.is]: null,
        },
      },
      order: [['updated_at', 'DESC']],
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
          parent_id: {
            [Op.is]: null,
          },
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.col('KelompokPelajaran.nama_kelpelajaran')
              ),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.col('children.nama_kelpelajaran')
              ),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(
                  Sequelize.col('KelompokPelajaran.nomor_urut'),
                  'TEXT'
                )
              ),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.col('KelompokPelajaran.keterangan')
              ),
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
      },
      include: [
        {
          model: Model,
          as: 'parent',
          required: false,
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
}

export const repository = new Repository();
