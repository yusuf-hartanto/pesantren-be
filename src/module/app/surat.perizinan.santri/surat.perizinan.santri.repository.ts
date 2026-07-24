'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './surat.perizinan.santri.model';
import OrganizationUnit from '../organization.unit/organization.unit.model';
import Jabatan from '../jabatan/jabatan.model';
import AreaProvince from '../../area/provinces.model';
import AreaRegency from '../../area/regencies.model';
import AreaDistrict from '../../area/districts.model';
import AreaSubDistrict from '../../area/subdistricts.model';
import AppResource from '../resource/resource.model';
import PerizinanSantri from '../perizinan.santri/perizinan.santri.model';
import Lokasi from '../location/location.model';
import { getUserContextData } from '../../../context/userContext';

export default class Repository {
  public list(data: any) {
    const userContext = getUserContextData();
    const idCabang = userContext?.id_cabang;

    const query: any = {
      order: [['created_at', 'DESC']],
      include: [
        {
          model: PerizinanSantri,
          as: 'perizinanSantri',
          required: true,
          include: [
            {
              model: Lokasi,
              as: 'lokasiKamar',
              required: false,
              attributes: ['id_lokasi', 'nama_lokasi'],
            },
            {
              model: Lokasi,
              as: 'lokasiKerja',
              required: false,
              attributes: ['id_lokasi', 'nama_lokasi'],
            },
          ],
        },
      ],
      where: {},
    };

    if (idCabang) {
      query.where = {
        ...query.where,
        [Op.or]: [
          { '$perizinanSantri.lokasiKamar.id_cabang$': idCabang },
          { '$perizinanSantri.lokasiKerja.id_cabang$': idCabang },
        ],
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
    const userContext = getUserContextData();
    const idCabang = userContext?.id_cabang;

    const query: any = {
      order: [['created_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      subQuery: false,
      include: [
        {
          model: PerizinanSantri,
          as: 'perizinanSantri',
          required: true,
          include: [
            {
              model: Lokasi,
              as: 'lokasiKamar',
              required: false,
              attributes: ['id_lokasi', 'nama_lokasi'],
            },
            {
              model: Lokasi,
              as: 'lokasiKerja',
              required: false,
              attributes: ['id_lokasi', 'nama_lokasi'],
            },
          ],
        },
        {
          model: AppResource,
          as: 'pencetak',
          required: false,
          attributes: ['resource_id', 'full_name'],
        },
      ],
      where: {},
    };

    if (idCabang) {
      query.where = {
        ...query.where,
        [Op.or]: [
          { '$perizinanSantri.lokasiKamar.id_cabang$': idCabang },
          { '$perizinanSantri.lokasiKerja.id_cabang$': idCabang },
        ],
      };
    }

    const keyword = data?.keyword ? `%${data.keyword.toLowerCase()}%` : null;
    if (keyword) {
      query.where[Op.or] = [
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.col('SuratPerizinanSantri.nomor_surat')
          ),
          { [Op.like]: keyword }
        ),
      ];
    }

    return await Model.findAndCountAll(query);
  }

  public detail(condition: any, trx?: any) {
    const userContext = getUserContextData();
    const idCabang = userContext?.id_cabang;

    const whereClause: any = {
      ...condition,
    };

    if (idCabang) {
      whereClause[Op.or] = [
        { '$perizinanSantri.lokasiKamar.id_cabang$': idCabang },
        { '$perizinanSantri.lokasiKerja.id_cabang$': idCabang },
      ];
    }

    return Model.findOne({
      include: [
        {
          model: PerizinanSantri,
          as: 'perizinanSantri',
          include: [
            {
              model: Lokasi,
              as: 'lokasiKamar',
              required: false,
              attributes: ['id_lokasi', 'nama_lokasi'],
            },
            {
              model: Lokasi,
              as: 'lokasiKerja',
              required: false,
              attributes: ['id_lokasi', 'nama_lokasi'],
            },
          ],
        },
        { model: AppResource, as: 'pencetak' },
      ],
      where: whereClause,
      transaction: trx,
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

  public async listForExport(params: {
    q?: string;
    isTemplate?: boolean;
    limit?: number;
  }) {
    const { q, isTemplate, limit } = params;
    const keyword = q ? `%${q}%` : null;

    const userContext = getUserContextData();
    const idCabang = userContext?.id_cabang;

    let whereClause: any = {};

    if (idCabang) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { '$perizinanSantri.lokasiKamar.id_cabang$': idCabang },
          { '$perizinanSantri.lokasiKerja.id_cabang$': idCabang },
        ],
      };
    }

    if (!isTemplate && keyword) {
      const keywordLower = keyword.toLowerCase();
      whereClause[Op.or] = [
        ...(whereClause[Op.or] || []),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.col('SuratPerizinanSantri.nomor_surat')
          ),
          { [Op.like]: keywordLower }
        ),
      ];
    }

    return Model.findAll({
      where: whereClause,
      limit: limit || (isTemplate ? 5 : undefined),
      subQuery: false,
      include: [
        {
          model: PerizinanSantri,
          as: 'perizinanSantri',
          required: true,
          include: [
            {
              model: Lokasi,
              as: 'lokasiKamar',
              required: false,
              attributes: ['id_lokasi', 'nama_lokasi'],
            },
            {
              model: Lokasi,
              as: 'lokasiKerja',
              required: false,
              attributes: ['id_lokasi', 'nama_lokasi'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  public async resolveAreaIds(raw: any) {
    const findArea = async (
      model: any,
      id: string,
      parentField?: string,
      parentId?: string
    ) => {
      if (!id) return null;
      const condition: any = {
        id: Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('id')),
          id.trim().toLowerCase()
        ),
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
