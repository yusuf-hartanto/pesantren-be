'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './santri.program.model';
import ProgramPesantren from '../program.pesantren/program.pesantren.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['id', 'DESC']],
    };

    return Model.findAll({
      ...query,
      include: [
        {
          model: ProgramPesantren,
          as: 'program_pesantren',
          required: true,
          attributes: ['nama_program'],
        },
      ],
    });
  }

  public index(data: any) {
    let query: Object = {
      order: [['id', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          [Op.or]: [
            Sequelize.where(Sequelize.col('program_pesantren.nama_program'), {
              [Op.like]: `%${data?.keyword}%`,
            }),
          ],
        },
      };
    }
    return Model.findAndCountAll({
      ...query,
      include: [
        {
          model: ProgramPesantren,
          as: 'program_pesantren',
          required: false,
          attributes: ['nama_program'],
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
          model: ProgramPesantren,
          as: 'program_pesantren',
          required: true,
          attributes: ['nama_program'],
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
    });
  }

  public delete(data: any) {
    return Model.destroy({
      where: data?.condition,
    });
  }
}

export const repository = new Repository();
