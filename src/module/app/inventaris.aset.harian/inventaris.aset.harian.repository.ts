'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './inventaris.aset.harian.model';
import InventarisUmum from '../inventaris.umum/inventaris.umum.model';
import Asrama from '../asrama/asrama.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
    };

    return Model.findAll({
      ...query,
      include: [
        {
          model: InventarisUmum,
          as: 'inventaris_umum',
          required: true,
          attributes: ['kode_aset', 'nama_aset'],
        },
        {
          model: Asrama,
          as: 'asrama',
          required: true,
          attributes: ['nama_asrama'],
        },
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
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: {
          [Op.or]: [
            Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('catatan')), {
              [Op.like]: keyword,
            }),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('inventaris_umum.kode_aset')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('inventaris_umum.nama_aset')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('asrama.nama_asrama')),
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
          model: InventarisUmum,
          as: 'inventaris_umum',
          required: false,
          attributes: ['kode_aset', 'nama_aset'],
        },
        {
          model: Asrama,
          as: 'asrama',
          required: false,
          attributes: ['nama_asrama'],
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
          model: InventarisUmum,
          as: 'inventaris_umum',
          required: true,
          attributes: ['kode_aset', 'nama_aset'],
        },
        {
          model: Asrama,
          as: 'asrama',
          required: true,
          attributes: ['nama_asrama'],
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
