'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './cabang.model';
import AreaProvince from '../../area/provinces.model';
import AreaRegency from '../../area/regencies.model';
import AreaDistrict from '../../area/districts.model';
import AreaSubDistrict from '../../area/subdistricts.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['id_cabang', 'DESC']],
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
          cabang: { [Op.like]: `%${data?.cabang}%` },
        },
      };
    }

    return Model.findAll(query);
  }

  public index(data: any) {
    let query: Object = {
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
      query = {
        ...query,
        where: {
          [Op.or]: [
            { id_cabang: { [Op.like]: `%${data?.keyword}%` } },
            { nama_cabang: { [Op.like]: `%${data?.keyword}%` } },
            { keterangan: { [Op.like]: `%${data?.keyword}%` } },
            { alamat: { [Op.like]: `%${data?.keyword}%` } },
          ],
        },
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

  public listForExport(condition: any, limit?: number) {
    return Model.findAll({
      where: condition,
      limit: limit,
      include: [
        { model: AreaProvince, as: 'province', attributes: ['name'] },
        { model: AreaRegency, as: 'city', attributes: ['name'] },
        { model: AreaDistrict, as: 'district', attributes: ['name'] },
        { model: AreaSubDistrict, as: 'subDistrict', attributes: ['name'] },
      ],
      order: [['nama_cabang', 'ASC']]
    });
  }

  public findByName(name: string) {
    return Model.findOne({
      where: Model.sequelize?.where(
        Model.sequelize.fn('LOWER', Model.sequelize.col('nama_cabang')),
        name.toLowerCase().trim()
      )
    });
  }

  public async findAreaId(areaModel: any, name: string, parentField?: string, parentId?: string) {
    if (!name) return null;

    const whereClause: any = Model.sequelize?.where(
      Model.sequelize.fn('LOWER', Model.sequelize.col('name')),
      name.toLowerCase().trim()
    );

    const condition = (parentField && parentId) 
      ? { [Op.and]: [whereClause, { [parentField]: parentId }] } 
      : whereClause;

    const res = await areaModel.findOne({ 
      where: condition, 
      attributes: ['id'] 
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
      sub_district_id
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
      return await existing.update({
        ...payload,
      }, { transaction });
    } else {
      return await Model.create({
        ...payload,
      }, { transaction });
    }
  }
}

export const repository = new Repository();
