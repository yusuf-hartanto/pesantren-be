'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './santri.model';
import Cabang from '../cabang/cabang.model';
import OrangTuaWali from '../orang.tua.wali/orang.tua.wali.model';
import AreaDistrict from '../../area/districts.model';
import AreaProvince from '../../area/provinces.model';
import AreaRegency from '../../area/regencies.model';
import AreaSubDistrict from '../../area/subdistricts.model';
import { getUserContextData } from '../../../context/userContext';

export default class Repository {
  public list(data: any) {
    let query: any = {
      where: {
        status: { [Op.ne]: 9 },
      },
      order: [['created_at', 'DESC']],
    };
    if (data?.status != '') {
      query = {
        ...query,
        where: {
          status: {
            [Op.eq]: data?.status,
          },
        },
      };
    }

    const userContext = getUserContextData();
    if (data?.id_cabang && data?.id_cabang != '') {
      query.where = {
        ...query.where,
        id_cabang: data.id_cabang,
      };
    } else if (userContext && userContext?.id_cabang) {
      query.where = {
        ...query.where,
        id_cabang: userContext.id_cabang,
      };
    }

    return Model.findAll(query);
  }

  public index(data: any) {
    let query: any = {
      where: {
        status: { [Op.ne]: 9 },
      },
      order: [['updated_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      subQuery: false,
    };
    if (data?.keyword && data?.keyword != undefined) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: {
          status: { [Op.ne]: 9 },
          [Op.or]: [
            Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('fullname')), {
              [Op.like]: keyword,
            }),
          ],
        },
      };
    }
    if (data?.parent) {
      query.where = {
        ...query.where,
        id_wali: data?.parent,
      };
    }
    if (data?.status && data?.status != '') {
      query.where = {
        ...query.where,
        status: data?.status,
      };
    }
    const userContext = getUserContextData();
    if (data?.id_cabang && data?.id_cabang != '') {
      query.where = {
        ...query.where,
        '$cabang.id_cabang$': data?.id_cabang,
      };
    } else if (userContext && userContext?.id_cabang) {
      query.where = {
        ...query.where,
        '$cabang.id_cabang$': userContext.id_cabang,
      };
    }
    return Model.findAndCountAll({
      ...query,
      include: [
        {
          model: Cabang,
          as: 'cabang',
          required: false,
          attributes: [
            'id_cabang',
            'institution_id_sitrendi',
            'nama_cabang',
            'email',
          ],
          on: Sequelize.literal(
            `"cabang".id_cabang = (
              SELECT COALESCE(lpf.id_cabang, lpk.id_cabang)
              FROM penempatan_kelas_santri pks
              LEFT JOIN kelas_formal kf ON pks.id_kelas_formal = kf.id_kelas
              LEFT JOIN kelas_mda km ON pks.id_kelas_mda = km.id_kelas_mda
              LEFT JOIN lembaga_pendidikan_formal lpf ON kf.id_lembaga = lpf.id_lembaga
              LEFT JOIN lembaga_pendidikan_kepesantrenan lpk ON km.id_lembaga = lpk.id_lembaga
              WHERE pks.id_santri = "AppSantri".id_santri AND pks.status = 'Aktif'
              LIMIT 1
            )`
          ),
        },
        {
          model: OrangTuaWali,
          as: 'wali',
          required: false,
          attributes: ['id_wali', 'nama_wali', 'id_wali_sitrendi', 'no_hp'],
        },
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
          model: Cabang,
          as: 'cabang',
          required: false,
          on: Sequelize.literal(
            `"cabang".id_cabang = (
              SELECT COALESCE(lpf.id_cabang, lpk.id_cabang)
              FROM penempatan_kelas_santri pks
              LEFT JOIN kelas_formal kf ON pks.id_kelas_formal = kf.id_kelas
              LEFT JOIN kelas_mda km ON pks.id_kelas_mda = km.id_kelas_mda
              LEFT JOIN lembaga_pendidikan_formal lpf ON kf.id_lembaga = lpf.id_lembaga
              LEFT JOIN lembaga_pendidikan_kepesantrenan lpk ON km.id_lembaga = lpk.id_lembaga
              WHERE pks.id_santri = "AppSantri".id_santri AND pks.status = 'Aktif'
              LIMIT 1
            )`
          ),
          include: [
            {
              model: AreaProvince,
              as: 'province',
              attributes: ['id', 'name'],
              required: false,
            },
            {
              model: AreaRegency,
              as: 'city',
              attributes: ['id', 'name'],
              required: false,
            },
            {
              model: AreaDistrict,
              as: 'district',
              attributes: ['id', 'name'],
              required: false,
            },
            {
              model: AreaSubDistrict,
              as: 'subDistrict',
              attributes: ['id', 'name'],
              required: false,
            },
          ],
        },
        {
          model: OrangTuaWali,
          as: 'wali',
          required: false,
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
        },
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
        id_santri_sitrendi: data.id_santri_sitrendi,
      },
      defaults: data,
    });
    return result;
  }

  public async bulkUpsert(data: any) {
    await Model.bulkCreate(data, {
      conflictAttributes: ['id_santri_sitrendi', 'institution_id_sitrendi'],
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

        'id_cabang',
        'nama_cabang',

        'institution_id',
        'institution_name',

        'group_code_1',
        'group_code_2',
        'group_code_3',

        'nomor_nasabah',
        'kartu_santri_nomor',
        'kartu_santri',

        'status',
        'updated_at',
      ],
    });
  }
}

export const repository = new Repository();
