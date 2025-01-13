'use strict';

import { Op } from 'sequelize';
import Province from './provinces.model';
import Regency from './regencies.model';

export default class Respository {
  public province() {
    return Province.findAll();
  }

  public indexRegency(data: any) {
    let query: Object = {
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword !== undefined && data?.keyword != null) {
      query = {
        ...query,
        where: { name: { [Op.like]: `%${data?.keyword}%` } },
      };
    }
    return Regency.findAndCountAll(query);
  }

  public regency(condition: any) {
    return Regency.findAll({
      where: condition,
    });
  }
}

export const repository = new Respository();
