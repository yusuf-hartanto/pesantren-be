'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './resource.model';
import AppRole from '../role/role.model';
import AreaRegency from '../../area/regencies.model';
import { ROLE_ADMIN } from '../../../utils/constant';
import AreaProvince from '../../area/provinces.model';
import Pegawai from '../pegawai/pegawai.model';
import OrganizationUnit from '../organization.unit/organization.unit.model';
import Cabang from '../cabang/cabang.model';
import JamKerjaPegawai from '../pegawai.jam.kerja/pegawai.jam.kerja.model';
import Lokasi from '../location/location.model';

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
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: {
          ...condition,
          status: { [Op.ne]: 'D' },
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('AppResource.username')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('AppResource.full_name')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('AppResource.email')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.col('AppResource.place_of_birth')
              ),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('role.role_name')),
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
        {
          model: Pegawai,
          as: 'pegawai',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
          include: [
            {
              model: OrganizationUnit,
              as: 'organizationUnit',
              attributes: ['id_orgunit', 'nama_orgunit'],
              required: false,
              include: [
                {
                  model: Cabang,
                  as: 'cabang',
                  attributes: ['id_cabang', 'nama_cabang'],
                  required: false,
                },
              ],
            },
            {
              model: JamKerjaPegawai,
              as: 'jamKerjaPegawai',
              attributes: ['id_lokasi', 'waktu_mulai', 'waktu_selesai'],
              required: false,
              include: [
                {
                  model: Lokasi,
                  as: 'lokasiKerja',
                  attributes: ['nama_lokasi'],
                },
              ],
            },
          ],
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
