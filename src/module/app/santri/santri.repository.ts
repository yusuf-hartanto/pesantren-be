'use strict';

import { Op } from 'sequelize';
import Model from './santri.model';
import AppInstitution from '../institution/institution.model';
import OrangTuaWali from '../orang.tua.wali/orang.tua.wali.model';

export default class Repository {
  public list(condition: any = {}) {
    return Model.findAll({
      where: {
        ...condition,
        status: { [Op.ne]: 9 },
      },
      order: [['updated_at', 'DESC']],
    });
  }

  public index(data: any) {
    let query: Object = {
      where: {
        status: { [Op.ne]: 9 },
      },
      order: [['updated_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          status: { [Op.ne]: 9 },
          [Op.or]: [{ role_name: { [Op.like]: `%${data?.keyword}%` } }],
        },
      };
    }
    return Model.findAndCountAll({
      ...query,
      include: [
        {
          model: AppInstitution,
          as: 'institution',
          required: false,
          attributes: ['id_institution', 'institution_id_sitrendi', 'institution_name'],
        },
        {
          model: OrangTuaWali,
          as: 'wali',
          required: false,
          attributes: ['id_wali', 'nama_wali', 'id_wali_sitrendi','no_hp'],
        }
      ],
    });
  }

  public detail(condition: any) {
    return Model.findOne({
      where: {
        ...condition,
        status: { [Op.ne]: 9 },
      },
      include: [
        {
          model: AppInstitution,
          as: 'institution',
          required: false,
          attributes: ['id_institution', 'institution_id_sitrendi', 'institution_name'],
        },
        {
          model: OrangTuaWali,
          as: 'wali',
          required: false,
          attributes: ['id_wali', 'nama_wali', 'id_wali_sitrendi','no_hp'],
        }
      ],
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
        id_santri_sitrendi: data.id_santri_sitrendi
      },
      defaults: data,
    });
    return result;
  }
  
  public async bulkUpsert(data: any) {
    await Model.bulkCreate(data, {
      conflictAttributes: [
        'id_santri_sitrendi',
        'institution_id_sitrendi'
      ],
      updateOnDuplicate: [
        'id_wali',
        'id_wali_sitrendi',

        'fullname',
        'nis',
        'nik',
        'gender',
        'birth_place',
        'birth_date',
        'phone',

        'institution_id',
        'institution_name',

        'group_code_1',
        'group_code_2',
        'group_code_3',

        'nomor_nasabah',
        'nomor_rekening',
        'kartu_santri',

        'status',
        'updated_at'
      ]
    });
  }
}

export const repository = new Repository();
