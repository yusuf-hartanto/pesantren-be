'use strict';

import { Op } from 'sequelize';
import Form from './form.model';
import Event from './event.model';
import FormAnswer from './form.answer.model';
import FormAnswerValue from './form.answer.value.model';

export default class Respository {
  public list() {
    return Event.findAll({
      where: {
        status: { [Op.ne]: 9 },
      },
      order: [['role_id', 'DESC']],
    });
  }

  public index(data: any) {
    let query: Object = {
      order: [['role_id', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword !== undefined && data?.keyword != null) {
      query = {
        ...query,
        where: {
          status: { [Op.ne]: 9 },
          [Op.or]: [{ role_name: { [Op.like]: `%${data?.keyword}%` } }],
        },
      };
    }
    return Event.findAndCountAll(query);
  }

  public detail(condition: any) {
    return Event.findOne({
      where: {
        ...condition,
        status: { [Op.ne]: 9 },
      },
    });
  }

  public create(data: any) {
    return Event.create(data?.payload);
  }

  public update(data: any) {
    return Event.update(data?.payload, {
      where: data?.condition,
    });
  }
}

export const repository = new Respository();
