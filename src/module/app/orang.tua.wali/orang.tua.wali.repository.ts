'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './orang.tua.wali.model';
import AreaProvince from '../../area/provinces.model';
import AreaRegency from '../../area/regencies.model';
import AreaDistrict from '../../area/districts.model';
import AreaSubDistrict from '../../area/subdistricts.model';
//import Santri from '../santri/santri.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
      where: {
        is_deleted: false,
      },
    };
    return Model.findAll({
      ...query,
      include: [
        {
          model: AreaProvince,
          as: 'province',
          required: true,
          attributes: ['name'],
        },
        {
          model: AreaRegency,
          as: 'city',
          required: true,
          attributes: ['name'],
        },
        {
          model: AreaDistrict,
          as: 'district',
          required: true,
          attributes: ['name'],
        },
        {
          model: AreaSubDistrict,
          as: 'sub_district',
          required: true,
          attributes: ['name'],
        },
      ],
    });
  }

  public index(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      where: {
        is_deleted: false,
      },
    };
    if (data?.keyword && data?.keyword != undefined) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: {
          [Op.or]: [
            Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('nama_wali')), {
              [Op.like]: keyword,
            }),
          ],
        },
      };
    }
    return Model.findAndCountAll({
      ...query,
      include: [
        {
          model: AreaProvince,
          as: 'province',
          required: false,
          attributes: ['name'],
        },
        {
          model: AreaRegency,
          as: 'city',
          required: false,
          attributes: ['name'],
        },
        {
          model: AreaDistrict,
          as: 'district',
          required: false,
          attributes: ['name'],
        },
        {
          model: AreaSubDistrict,
          as: 'sub_district',
          required: false,
          attributes: ['name'],
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
          model: AreaProvince,
          as: 'province',
          required: true,
          attributes: ['id', 'name'],
        },
        {
          model: AreaRegency,
          as: 'city',
          required: true,
          attributes: ['id', 'name'],
        },
        {
          model: AreaDistrict,
          as: 'district',
          required: true,
          attributes: ['id', 'name'],
        },
        {
          model: AreaSubDistrict,
          as: 'sub_district',
          required: true,
          attributes: ['id', 'name'],
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

  public all(condition: any = {}) {
    return Model.findAll({
      where: {
        ...condition,
        is_deleted: false,
      },
      order: [['created_at', 'DESC']],
    });
  }

  public async upsert(data: any) {
    const [result] = await Model.findOrCreate({
      where: {
        id_wali_sitrendi: data.id_wali_sitrendi,
      },
      defaults: data,
    });
    return result;
  }

  public async bulkUpsert(data: any) {
    await Model.bulkCreate(data, {
      conflictAttributes: ['id_wali_sitrendi'],
      updateOnDuplicate: [
        'nama_wali',
        'no_hp',
        'nik',
        'alamat',
        'keterangan',
        'hubungan',
        'pendidikan',
        'pekerjaan',
        'updated_at',
      ],
    });
  }
}

export const repository = new Repository();
