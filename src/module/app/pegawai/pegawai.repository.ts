'use strict';

import { Op } from 'sequelize';
import Model from './pegawai.model';
import OrganizationUnit from '../organization.unit/organization.unit.model';
import Jabatan from '../jabatan/jabatan.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['id_pegawai', 'DESC']],
      include: [
        {
          model: OrganizationUnit,
          as: 'organitazionUnit',
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
  public async checkDuplicate(field: string, value: string, excludeId?: string) {
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
      where: {}
    };

    if (data?.keyword) {
      query.where[Op.or] = [
        { nama_lengkap: { [Op.like]: `%${data.keyword}%` } },
        { nik: { [Op.like]: `%${data.keyword}%` } },
        { nip: { [Op.like]: `%${data.keyword}%` } },
        { email: { [Op.like]: `%${data.keyword}%` } },
        { '$organizationUnit.nama_orgunit$': { [Op.like]: `%${data.keyword}%` } },
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
        { all: true, nested: true } // Mengambil relasi wilayah
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
}

export const repository = new Repository();