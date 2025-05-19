'use strict';

import { Op } from 'sequelize';
import AreaProvince from './provinces.model';
import AreaRegency from './regencies.model';

export default class Repository {
  public province() {
    return AreaProvince.findAll();
  }

  public provinceDetail(condition: any) {
    return AreaProvince.findOne({
      where: condition,
    });
  }

  public indexRegency(data: any) {
    let query: Object = {
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: { name: { [Op.like]: `%${data?.keyword}%` } },
      };
    }
    return AreaRegency.findAndCountAll(query);
  }

  public regency(condition: any) {
    return AreaRegency.findAll({
      where: condition,
    });
  }

  public regencyDetail(condition: any) {
    return AreaRegency.findOne({
      where: condition,
    });
  }
}

export const repository = new Repository();
