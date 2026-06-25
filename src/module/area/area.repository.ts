'use strict';

import { Op, Sequelize } from 'sequelize';
import AreaProvince from './provinces.model';
import AreaRegency from './regencies.model';
import AreaDistrict from './districts.model';
import AreaSubDistrict from './subdistricts.model';

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
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('name')), {
          [Op.like]: keyword,
        }),
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

  public indexDistrict(data: any) {
    let query: Object = {
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('name')), {
          [Op.like]: keyword,
        }),
      };
    }
    return AreaDistrict.findAndCountAll(query);
  }

  public district(condition: any) {
    return AreaDistrict.findAll({
      where: condition,
    });
  }

  public districtDetail(condition: any) {
    return AreaDistrict.findOne({
      where: condition,
    });
  }

  public indexSubDistrict(data: any) {
    let query: Object = {
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('name')), {
          [Op.like]: keyword,
        }),
      };
    }
    return AreaSubDistrict.findAndCountAll(query);
  }

  public subdistrict(condition: any) {
    return AreaSubDistrict.findAll({
      where: condition,
    });
  }

  public subdistrictDetail(condition: any) {
    return AreaSubDistrict.findOne({
      where: condition,
    });
  }
}

export const repository = new Repository();
