'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './cabang.model';
import AreaProvince from '../../area/provinces.model';
import AreaRegency from '../../area/regencies.model';
import AreaDistrict from '../../area/districts.model';
import AreaSubDistrict from '../../area/subdistricts.model';
import { getUserContextData } from '../../../context/userContext';

export default class Repository {
  public list(data: any) {
    let query: any = {
      order: [['nama_cabang', 'ASC'], [Sequelize.fn('LENGTH', Sequelize.col('nama_cabang')), 'ASC']],
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
    };

    if (data?.cabang !== undefined && data?.cabang != null) {
      query = {
        ...query,
        where: {
          cabang: Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(Sequelize.col('Cabang.cabang'), 'TEXT')
            ),
            {
              [Op.like]: `%${data.cabang.toLowerCase()}%`,
            }
          ),
        },
      };
    }

    const userContext = getUserContextData();
    if (userContext && userContext?.id_cabang && !data?.all_cabang) {
      query.where = {
        ...query.where,
        id_cabang: userContext?.id_cabang,
      };
    }

    return Model.findAll(query);
  }

  public index(data: any) {
    let query: any = {
      order: [['id_cabang', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
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
    };

    if (data?.keyword && data?.keyword != undefined) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: {
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(Sequelize.col('Cabang.id_cabang'), 'TEXT')
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('Cabang.nama_cabang')),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(Sequelize.col('Cabang.keterangan'), 'TEXT')
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(Sequelize.col('Cabang.alamat'), 'TEXT')
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('province.name')),
              { [Op.like]: keyword }
            ),
            Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('city.name')), {
              [Op.like]: keyword,
            }),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('district.name')),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('subDistrict.name')),
              { [Op.like]: keyword }
            ),
          ],
        },
      };
    }
    
    const userContext = getUserContextData();
    if (userContext && userContext?.id_cabang) {
      query.where = {
        ...query.where,
        id_cabang: userContext?.id_cabang,
      };
    }

    return Model.findAndCountAll(query);
  }

  public detail(condition: any) {
    return Model.findOne({
      where: {
        ...condition,
      },
    });
  }

  public async create(data: any) {
    return Model.bulkCreate(data.payload);
  }

  public update(data: any) {
    return Model.update(data?.payload, {
      where: data?.condition,
    });
  }

  public delete(data: any) {
    return Model.destroy({
      where: data?.condition,
    });
  }

  public async listForExport(params: {
    q?: string;
    isTemplate?: boolean;
    limit?: number;
  }) {
    const { q, isTemplate, limit } = params;
    const keyword = q ? `%${q}%` : null;

    let whereClause: any = {};

    const userContext = getUserContextData();
    if (userContext && userContext?.id_cabang) {
      whereClause = {
        ...whereClause,
        id_cabang: userContext?.id_cabang,
      };
    }

    if (!isTemplate && keyword) {
      const keywordLower = keyword.toLowerCase();
      whereClause = {
        [Op.or]: [
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(Sequelize.col('Cabang.id_cabang'), 'TEXT')
            ),
            { [Op.like]: keywordLower }
          ),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('Cabang.nama_cabang')),
            { [Op.like]: keywordLower }
          ),
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(Sequelize.col('Cabang.keterangan'), 'TEXT')
            ),
            { [Op.like]: keywordLower }
          ),
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(Sequelize.col('Cabang.alamat'), 'TEXT')
            ),
            { [Op.like]: keywordLower }
          ),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('province.name')),
            { [Op.like]: keywordLower }
          ),
          Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('city.name')), {
            [Op.like]: keywordLower,
          }),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('district.name')),
            { [Op.like]: keywordLower }
          ),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('subDistrict.name')),
            { [Op.like]: keywordLower }
          ),
        ],
      };
    }

    return Model.findAll({
      where: whereClause,
      limit: limit || (isTemplate ? 5 : undefined),
      include: [
        {
          model: AreaProvince,
          as: 'province',
          attributes: ['id', 'name'],
          required: false, // Gunakan false agar cabang tetap muncul meski wilayahnya null
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
      // Urutkan berdasarkan nama cabang agar rapi saat di-export
      order: [['nama_cabang', 'ASC']],
    });
  }

  public findByName(name: string) {
    return Model.findOne({
      where: Model.sequelize?.where(
        Model.sequelize.fn('LOWER', Model.sequelize.col('nama_cabang')),
        name.toLowerCase().trim()
      ),
    });
  }

  public async validateAreaIds(raw: any) {
    const checkId = async (model: any, id: any) => {
      if (id === null || id === undefined || id === '') return null;

      const cleanId = String(id).trim();

      const res = await model.findByPk(cleanId, { attributes: ['id'] });
      return res ? res.id : null;
    };

    // Gunakan mapping yang sesuai dengan input raw Anda
    const province_id = await checkId(AreaProvince, raw.provinsi);
    const city_id = await checkId(AreaRegency, raw.kota_kabupaten);
    const district_id = await checkId(AreaDistrict, raw.kecamatan);
    const sub_district_id = await checkId(AreaSubDistrict, raw.kelurahan);

    return {
      province_id,
      city_id,
      district_id,
      sub_district_id,
    };
  }

  public async findAreaId(
    areaModel: any,
    name: string,
    parentField?: string,
    parentId?: string
  ) {
    if (!name) return null;

    const whereClause: any = Model.sequelize?.where(
      Model.sequelize.fn('LOWER', Model.sequelize.col('name')),
      name.toLowerCase().trim()
    );

    const condition =
      parentField && parentId
        ? { [Op.and]: [whereClause, { [parentField]: parentId }] }
        : whereClause;

    const res = await areaModel.findOne({
      where: condition,
      attributes: ['id'],
    });

    return res ? res.id : null;
  }

  public async resolveAreaIds(raw: any) {
    const province_id = await this.findAreaId(AreaProvince, raw.provinsi);

    const city_id = await this.findAreaId(
      AreaRegency,
      raw.kota_kabupaten,
      'area_province_id',
      province_id
    );

    const district_id = await this.findAreaId(
      AreaDistrict,
      raw.kecamatan,
      'area_regencies_id',
      city_id
    );

    const sub_district_id = await this.findAreaId(
      AreaSubDistrict,
      raw.kelurahan,
      'area_district_id',
      district_id
    );

    return {
      province_id,
      city_id,
      district_id,
      sub_district_id,
    };
  }

  public async insertImport(payloads: any[]) {
    const trx = await Model.sequelize?.transaction();

    try {
      for (const item of payloads) {
        await this.upsertImport(item, trx);
      }
      if (trx) await trx.commit();
      return true;
    } catch (error) {
      if (trx) await trx.rollback();
      throw error;
    }
  }

  public async upsertImport(payload: any, transaction: any = null) {
    const existing = await this.findByName(payload.nama_cabang);

    if (existing) {
      return await existing.update(
        {
          ...payload,
        },
        { transaction }
      );
    } else {
      return await Model.create(
        {
          ...payload,
        },
        { transaction }
      );
    }
  }

  public all(condition: any = {}) {
    return Model.findAll({
      where: condition,
      order: [['id_cabang', 'DESC']],
    });
  }

  public async bulkUpsert(data: any) {
    await Model.bulkCreate(data, {
      conflictAttributes: ['nama_cabang'],
      updateOnDuplicate: ['institution_id_sitrendi', 'updated_at'],
    });
  }
}

export const repository = new Repository();
