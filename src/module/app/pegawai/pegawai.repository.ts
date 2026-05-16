'use strict';

import { Op } from 'sequelize';
import Model from './pegawai.model';
import OrganizationUnit from '../organization.unit/organization.unit.model';
import Jabatan from '../jabatan/jabatan.model';
import AreaProvince from '../../area/provinces.model';
import AreaRegency from '../../area/regencies.model';
import AreaDistrict from '../../area/districts.model';
import AreaSubDistrict from '../../area/subdistricts.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['id_pegawai', 'DESC']],
      include: [
        {
          model: OrganizationUnit,
          as: 'organizationUnit',
          attributes: ['id_orgunit', 'nama_orgunit'],
          required: false,
        },
        {
          model: Jabatan,
          as: 'jabatan',
          attributes: ['id_jabatan', 'nama_jabatan'],
          required: false,
        },
      ],
    };

    const keyword = data?.keyword ? `%${data.keyword}%` : null;

    if (keyword) {
      query = {
        ...query,
        where: {
          nama_orgunit: { [Op.like]: keyword },
        },
      };
    }

    return Model.findAll(query);
  }
  /**
   * Cek duplikasi field tertentu (NIK/NIP/Email)
   */
  public async checkDuplicate(
    field: string,
    value: string,
    excludeId?: string
  ) {
    const where: any = { [field]: value };
    if (excludeId) {
      where.id_pegawai = { [Op.ne]: excludeId };
    }
    return await Model.findOne({ where });
  }

  public async index(data: any) {
    const query: any = {
      order: [['created_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      subQuery: false,
      include: [
        {
          model: OrganizationUnit,
          as: 'organizationUnit',
          attributes: ['id_orgunit', 'nama_orgunit'],
          required: false,
        },
        {
          model: Jabatan,
          as: 'jabatan',
          attributes: ['id_jabatan', 'nama_jabatan'],
          required: false,
        },
      ],
      where: {},
    };

    if (data?.keyword) {
      query.where[Op.or] = [
        { nama_lengkap: { [Op.like]: `%${data.keyword}%` } },
        { nik: { [Op.like]: `%${data.keyword}%` } },
        { nip: { [Op.like]: `%${data.keyword}%` } },
        { email: { [Op.like]: `%${data.keyword}%` } },
        {
          '$organizationUnit.nama_orgunit$': { [Op.like]: `%${data.keyword}%` },
        },
        { '$jabatan.nama_jabatan$': { [Op.like]: `%${data.keyword}%` } },
      ];
    }

    return await Model.findAndCountAll(query);
  }

  public detail(condition: any) {
    return Model.findOne({
      include: [
        { model: OrganizationUnit, as: 'organizationUnit' },
        { model: Jabatan, as: 'jabatan' },
        { all: true, nested: true }, // Mengambil relasi wilayah
      ],
      where: condition,
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

  /**
   * Soft Delete mengandalkan properti { paranoid: true } di Model.
   */
  public async delete(condition: any) {
    return Model.destroy({
      where: condition,
    });
  }

  public listForExport(condition: any, limit?: number) {
    return Model.findAll({
      where: condition,
      limit: limit,
      include: [
        {
          model: OrganizationUnit,
          as: 'organizationUnit',
          attributes: ['nama_orgunit'],
        },
        { model: Jabatan, as: 'jabatan', attributes: ['nama_jabatan'] },
        { model: AreaProvince, as: 'province', attributes: ['name'] },
        { model: AreaRegency, as: 'city', attributes: ['name'] },
        { model: AreaDistrict, as: 'district', attributes: ['name'] },
        { model: AreaSubDistrict, as: 'subDistrict', attributes: ['name'] },
      ],
      order: [['nama_lengkap', 'ASC']],
    });
  }

  public async resolveAreaIds(raw: any) {
    const findArea = async (
      model: any,
      name: string,
      parentField?: string,
      parentId?: string
    ) => {
      if (!name) return null;
      const condition: any = {
        name: { [Op.iLike]: name.trim() },
      };

      if (parentField && parentId) {
        condition[parentField] = parentId;
      }

      const res = await model.findOne({
        where: condition,
        attributes: ['id'],
      });

      return res ? res.id : null;
    };

    const province_id = await findArea(AreaProvince, raw.provinsi);
    const city_id = await findArea(
      AreaRegency,
      raw.kota_kabupaten,
      'area_province_id',
      province_id
    );
    const district_id = await findArea(
      AreaDistrict,
      raw.kecamatan,
      'area_regencies_id',
      city_id
    );
    const sub_district_id = await findArea(
      AreaSubDistrict,
      raw.kelurahan,
      'area_district_id',
      district_id
    );

    return { province_id, city_id, district_id, sub_district_id };
  }

  public async insertImport(payloads: any[]) {
    const trx = await Model.sequelize?.transaction();
    try {
      for (const item of payloads) {
        const existing = await Model.findOne({
          where: {
            [Op.or]: [{ nik: item.nik }, { nip: item.nip }],
          },
        });

        if (existing) {
          await existing.update(item, { transaction: trx });
        } else {
          await Model.create(item, { transaction: trx });
        }
      }
      await trx?.commit();
      return true;
    } catch (error) {
      await trx?.rollback();
      throw error;
    }
  }
}

export const repository = new Repository();
