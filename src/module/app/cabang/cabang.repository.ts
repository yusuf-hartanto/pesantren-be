'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './cabang.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['id_cabang', 'DESC']],
    };
    
    if (data?.cabang !== undefined && data?.cabang != null) {
      query = {
        ...query,
        where: {
          cabang: { [Op.like]: `%${data?.cabang}%` },
        },
      };
    }

    return Model.findAll(query);
  }

  public index(data: any) {
    let query: Object = {
      order: [['id_cabang', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
  
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          [Op.or]: [
            { id_cabang: { [Op.like]: `%${data?.keyword}%` } },
            { nama_cabang: { [Op.like]: `%${data?.keyword}%` } },
            Sequelize.where(
              Sequelize.cast(Sequelize.col('nomor_urut'), 'TEXT'),
              { [Op.like]: `%${data?.keyword}%` }
            ),
            { keterangan: { [Op.like]: `%${data?.keyword}%` } },
            { alamat: { [Op.like]: `%${data?.keyword}%` } },
          ],
        },
      };
    }
  
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
    return Model.bulkCreate(data.payload);
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
