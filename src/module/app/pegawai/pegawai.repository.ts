'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './pegawai.model';
import OrganizationUnit from '../organization.unit/organization.unit.model';
import Jabatan from '../jabatan/jabatan.model';
import AreaProvince from '../../area/provinces.model';
import AreaRegency from '../../area/regencies.model';
import AreaDistrict from '../../area/districts.model';
import AreaSubDistrict from '../../area/subdistricts.model';
import AppResource from '../resource/resource.model';
import AppRole from '../role/role.model';
import { v4 as uuidv4 } from 'uuid';
import { helper } from '../../../helpers/helper';

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

    const keyword = data?.keyword ? `%${data.keyword}%` : null;

    if (keyword) {
      query.where[Op.or] = [
        { nama_lengkap: { [Op.iLike]: keyword } },
        { nik: { [Op.iLike]: keyword } },
        { nip: { [Op.iLike]: keyword } },
        { email: { [Op.iLike]: keyword } },
        Sequelize.where(
          Sequelize.cast(Sequelize.col('Pegawai.status_pegawai'), 'text'),
          { [Op.iLike]: keyword }
        ),
        { '$organizationUnit.nama_orgunit$': { [Op.iLike]: keyword } },
        { '$jabatan.nama_jabatan$': { [Op.iLike]: keyword } },
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
    const trx = data.transaction;

    const pegawais = await Model.bulkCreate(data.payload, { transaction: trx });

    let idx = 0;
    for (const item of data.rawPayload || []) {
      if (item.email) {
        const username = item.email.split('@')[0];

        const existingResource = await AppResource.findOne({
          where: {
            [Op.or]: [{ username }, { email: item.email }],
          },
          transaction: trx,
        });

        if (existingResource) {
          throw new Error(
            `Username [${username}] atau Email [${item.email}] sudah terdaftar pada resource logins.`
          );
        }

        let role = await AppRole.findOne({
          where: { role_name: 'pegawai' },
          transaction: trx,
        });
        if (!role) {
          role = await AppRole.create(
            {
              role_name: 'pegawai',
              status: 1,
              restrict_level_area: 0,
              created_by: data.userId || 'system',
              created_date: new Date(),
            },
            { transaction: trx }
          );
        }

        const rawPassword = item.password || 'sada@123';
        const hashedPassword = await helper.hashIt(rawPassword);
        const confirm_hash = await helper.hashIt(username, 6);

        await AppResource.create({
          resource_id: uuidv4(),
          role_id: role.role_id,
          username,
          email: item.email,
          password: hashedPassword,
          full_name: item.nama_lengkap,
          telepon: item.no_hp || null,
          status: 'A',
          confirm_hash,
          created_by: data.userId || null,
          created_date: new Date(),
          id_eksternal: pegawais[idx].id_pegawai,
        }, { transaction: trx });
      }

      idx++;
    }

    return pegawais;
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

    let whereClause: any = {};

    // Jika bukan template dan ada keyword, terapkan filter pencarian
    if (!isTemplate && keyword) {
      whereClause[Op.or] = [
        { nama_lengkap: { [Op.iLike]: keyword } },
        { nik: { [Op.iLike]: keyword } },
        { nip: { [Op.iLike]: keyword } },
        { email: { [Op.iLike]: keyword } },
        Sequelize.where(
          Sequelize.cast(Sequelize.col('Pegawai.status_pegawai'), 'text'),
          { [Op.iLike]: keyword }
        ),
        { '$organizationUnit.nama_orgunit$': { [Op.iLike]: keyword } },
        { '$jabatan.nama_jabatan$': { [Op.iLike]: keyword } },
      ];
    }

    return Model.findAll({
      where: whereClause,
      limit: limit || (isTemplate ? 5 : undefined),
      subQuery: false,
      include: [
        {
          model: OrganizationUnit,
          as: 'organizationUnit',
          attributes: ['id_orgunit', 'nama_orgunit'],
        },
        {
          model: Jabatan,
          as: 'jabatan',
          attributes: ['id_jabatan', 'nama_jabatan'],
        },
        { model: AreaProvince, as: 'province', attributes: ['id', 'name'] },
        { model: AreaRegency, as: 'city', attributes: ['id', 'name'] },
        { model: AreaDistrict, as: 'district', attributes: ['id', 'name'] },
        {
          model: AreaSubDistrict,
          as: 'subDistrict',
          attributes: ['id', 'name'],
        },
      ],
      order: [['nama_lengkap', 'ASC']],
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
        id: { [Op.iLike]: id.trim() },
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

        if (item.email) {
          const username = item.email.split('@')[0];

          const existingResource = await AppResource.findOne({
            where: {
              [Op.or]: [{ username }, { email: item.email }],
            },
            transaction: trx,
          });

          if (!existingResource) {
            let role = await AppRole.findOne({
              where: { role_name: 'pegawai' },
              transaction: trx,
            });
            if (!role) {
              role = await AppRole.create(
                {
                  role_name: 'pegawai',
                  status: 1,
                  restrict_level_area: 0,
                  created_by: 'system',
                  created_date: new Date(),
                },
                { transaction: trx }
              );
            }

            const rawPassword = item.password || 'sada@123';
            const hashedPassword = await helper.hashIt(rawPassword);
            const confirm_hash = await helper.hashIt(username, 6);

            await AppResource.create(
              {
                resource_id: uuidv4(),
                role_id: role.role_id,
                username,
                email: item.email,
                password: hashedPassword,
                full_name: item.nama_lengkap,
                telepon: item.no_hp || null,
                status: 'A',
                confirm_hash,
                created_by: 'system',
                created_date: new Date(),
              },
              { transaction: trx }
            );
          }
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
