'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './institution.model';

export default class Repository {
  public list(condition: any = {}) {
    return Model.findAll({
      where: {
        ...condition,
        status: { [Op.ne]: 9 },
      },
      order: [['institution_name', 'ASC']],
    });
  }

  public index(data: any) {
    let query: Object = {
      where: {
        status: { [Op.ne]: 9 },
        institution_id_sitrendi: { [Op.ne]: null },
      },
      order: [['updated_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: {
          status: { [Op.ne]: 9 },
          [Op.or]: [
            Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('institution_name')), {
              [Op.like]: keyword,
            }),
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
        status: { [Op.ne]: 9 },
      },
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

  public async upsert(data: any) {
    const [result] = await Model.findOrCreate({
      where: {
        institution_id_sitrendi: data.institution_id_sitrendi,
      },
      defaults: data,
    });
    return result;
  }

  public async bulkUpsert(data: any) {
    await Model.bulkCreate(data, {
      conflictAttributes: ['institution_id_sitrendi'],
      updateOnDuplicate: ['institution_name', 'updated_at'],
    });
  }
}

export const repository = new Repository();
