'use strict';

import { Op } from 'sequelize';
import Model from './resource.model';
import AppRole from '../role/role.model';
import AreaRegency from '../../area/regencies.model';
import { ROLE_ADMIN } from '../../../utils/constant';
import AreaProvince from '../../area/provinces.model';

export default class Repository {
  public list(data: any) {
    return Model.findAll({
      where: data?.condition,
      order: [['created_date', 'DESC']],
    });
  }

  public index(data: any, condition: any, conditionRole: Object = {}) {
    let query: Object = {
      where: {
        ...condition,
        status: { [Op.ne]: 'D' },
      },
      order: [['created_date', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          ...condition,
          status: { [Op.ne]: 'D' },
          [Op.or]: [
            { username: { [Op.like]: `%${data?.keyword}%` } },
            { full_name: { [Op.like]: `%${data?.keyword}%` } },
            { email: { [Op.like]: `%${data?.keyword}%` } },
            { place_of_birth: { [Op.like]: `%${data?.keyword}%` } },
          ],
        },
      };
    }
    return Model.findAndCountAll({
      ...query,
      attributes: {
        exclude: ['password', 'confirm_hash', 'token'],
      },
      include: [
        {
          model: AppRole,
          attributes: ['role_id', 'role_name', 'status'],
          as: 'role',
          required: true,
          where: {
            ...conditionRole,
          },
        },
        {
          model: AreaProvince,
          attributes: ['id', 'name'],
          as: 'province',
          required: false,
        },
        {
          model: AreaRegency,
          attributes: ['id', 'name', 'area_province_id'],
          as: 'regency',
          required: false,
        },
      ],
    });
  }

  public detail(condition: any, admin: string = ROLE_ADMIN) {
    return Model.findOne({
      where: {
        ...condition,
        status: { [Op.ne]: 'D' },
      },
      include: [
        {
          model: AppRole,
          attributes: ['role_id', 'role_name', 'status'],
          as: 'role',
          required: true,
          where: {
            role_name: { [Op.ne]: admin },
          },
        },
        {
          model: AreaProvince,
          attributes: ['id', 'name'],
          as: 'province',
          required: false,
        },
        {
          model: AreaRegency,
          attributes: ['id', 'name', 'area_province_id'],
          as: 'regency',
          required: false,
        },
      ],
    });
  }

  public check(condition: any, admin: string = ROLE_ADMIN) {
    return Model.findOne({
      where: {
        ...condition,
        status: { [Op.ne]: 'D' },
      },
      include: [
        {
          model: AppRole,
          attributes: ['role_id', 'role_name', 'status'],
          as: 'role',
          required: true,
          where: {
            role_name: { [Op.ne]: admin },
          },
        },
      ],
    });
  }

  public admin(condition: any) {
    return Model.findAll({
      where: {
        ...condition,
        status: { [Op.ne]: 'D' },
      },
      include: [
        {
          model: AppRole,
          attributes: ['role_id', 'role_name', 'status'],
          as: 'role',
          required: true,
          where: {
            role_name: ROLE_ADMIN,
          },
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
}

export const repository = new Repository();
