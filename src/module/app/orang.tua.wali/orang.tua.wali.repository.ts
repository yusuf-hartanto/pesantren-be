'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './orang.tua.wali.model';
import AreaProvince from '../../area/provinces.model';
import AreaRegency from '../../area/regencies.model';
import AreaDistrict from '../../area/districts.model';
import AreaSubDistrict from '../../area/subdistricts.model';
import Santri from '../santri/santri.model';
import Cabang from '../cabang/cabang.model';
import { getUserContextData } from '../../../context/userContext';

export default class Repository {
  public list(data: any) {
    const userContext = getUserContextData();
    let query: any = {
      order: [['created_at', 'DESC']],
      where: {
        is_deleted: false,
      },
    };

    let includes: any[] = [
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
    ];

    const idCabang = data?.id_cabang || userContext?.id_cabang;
    if (idCabang) {
      includes.push({
        model: Santri,
        as: 'santri',
        required: true,
        attributes: ['id_santri', 'fullname'],
        include: [
          {
            model: Cabang,
            as: 'cabang',
            attributes: [],
            required: true,
            on: Sequelize.literal(
              `"santri->cabang".id_cabang = (
                SELECT COALESCE(lpf.id_cabang, lpk.id_cabang)
                FROM penempatan_kelas_santri pks
                LEFT JOIN kelas_formal kf ON pks.id_kelas_formal = kf.id_kelas
                LEFT JOIN kelas_mda km ON pks.id_kelas_mda = km.id_kelas_mda
                LEFT JOIN lembaga_pendidikan_formal lpf ON kf.id_lembaga = lpf.id_lembaga
                LEFT JOIN lembaga_pendidikan_kepesantrenan lpk ON km.id_lembaga = lpk.id_lembaga
                WHERE pks.id_santri = "santri".id_santri AND pks.status = 'Aktif'
                LIMIT 1
              )`
            ),
            where: {
              id_cabang: idCabang,
            },
          },
        ],
      });
    } else {
      includes.push({
        model: Santri,
        as: 'santri',
        required: false,
        attributes: ['id_santri', 'fullname'],
      });
    }

    return Model.findAll({
      ...query,
      include: includes,
    });
  }

  public index(data: any) {
    const userContext = getUserContextData();
    let query: any = {
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
          is_deleted: false,
          [Op.or]: [
            Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('nama_wali')), {
              [Op.like]: keyword,
            }),
          ],
        },
      };
    }

    let includes: any[] = [
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
    ];

    const idCabang = data?.id_cabang || userContext?.id_cabang;
    if (idCabang) {
      includes.push({
        model: Santri,
        as: 'santri',
        required: true,
        attributes: ['id_santri', 'fullname'],
        include: [
          {
            model: Cabang,
            as: 'cabang',
            attributes: [],
            required: true,
            on: Sequelize.literal(
              `"santri->cabang".id_cabang = (
                SELECT COALESCE(lpf.id_cabang, lpk.id_cabang)
                FROM penempatan_kelas_santri pks
                LEFT JOIN kelas_formal kf ON pks.id_kelas_formal = kf.id_kelas
                LEFT JOIN kelas_mda km ON pks.id_kelas_mda = km.id_kelas_mda
                LEFT JOIN lembaga_pendidikan_formal lpf ON kf.id_lembaga = lpf.id_lembaga
                LEFT JOIN lembaga_pendidikan_kepesantrenan lpk ON km.id_lembaga = lpk.id_lembaga
                WHERE pks.id_santri = "santri".id_santri AND pks.status = 'Aktif'
                LIMIT 1
              )`
            ),
            where: {
              id_cabang: idCabang,
            },
          },
        ],
      });
    } else {
      includes.push({
        model: Santri,
        as: 'santri',
        required: false,
        attributes: ['id_santri', 'fullname'],
      });
    }

    return Model.findAndCountAll({
      ...query,
      include: includes,
      distinct: true,
      subQuery: false,
    });
  }

  public detail(condition: any) {
    return Model.findOne({
      where: {
        ...condition,
      },
      include: [
        {
          model: Santri,
          as: 'santri',
          required: false,
          attributes: ['id_santri', 'fullname'],
        },
        {
          model: AreaProvince,
          as: 'province',
          required: false,
          attributes: ['id', 'name'],
        },
        {
          model: AreaRegency,
          as: 'city',
          required: false,
          attributes: ['id', 'name'],
        },
        {
          model: AreaDistrict,
          as: 'district',
          required: false,
          attributes: ['id', 'name'],
        },
        {
          model: AreaSubDistrict,
          as: 'sub_district',
          required: false,
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
