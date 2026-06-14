'use strict';

import { Op } from 'sequelize';
import Santri from '../santri/santri.model';
import KelasMda from '../kelas.mda/kelas.mda.model';
import KelasFormal from '../kelas.formal/kelas.formal.model';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';
import AppResource from '../resource/resource.model';
import Model from './penempatan.kelas.santri.model';

export default class Repository {
  public list(data: any) {
    const query: any = {
      order: [['updated_at', 'DESC']],
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'fullname', 'nis'],
          required: false,
        },
        {
          model: KelasMda,
          as: 'kelasMda',
          attributes: ['id_kelas_mda', 'nama_kelas_mda'],
          required: false,
        },
        {
          model: KelasFormal,
          as: 'kelasFormal',
          attributes: ['id_kelas', 'nama_kelas'],
          required: false,
        },
        {
          model: TahunAjaran,
          as: 'tahunAjaran',
          attributes: ['id_tahunajaran', 'tahun_ajaran'],
          required: false,
        },
      ],
      where: {},
    };

    if (data?.status) {
      query.where.status = data.status;
    }

    if (data?.id_santri) {
      query.where.id_santri = data.id_santri;
    }

    return Model.findAll(query);
  }

  public async index(data: any) {
    const where: any = {};

    if (data?.status) {
      where.status = data.status;
    }

    if (data?.id_santri) {
      where.id_santri = data.id_santri;
    }

    if (data?.keyword) {
      const keyword = `%${data.keyword}%`;
      where[Op.or] = [
        { status: { [Op.iLike]: keyword } },
        { '$santri.fullname$': { [Op.iLike]: keyword } },
        { '$santri.nis$': { [Op.iLike]: keyword } },
        { '$kelasMda.nama_kelas_mda$': { [Op.iLike]: keyword } },
        { '$kelasFormal.nama_kelas$': { [Op.iLike]: keyword } },
        { '$tahunAjaran.tahun_ajaran$': { [Op.iLike]: keyword } },
      ];
    }

    const query: any = {
      order: [['updated_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      subQuery: false,
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'fullname', 'nis', 'nik'],
          required: false,
        },
        {
          model: KelasMda,
          as: 'kelasMda',
          attributes: ['id_kelas_mda', 'nama_kelas_mda'],
          required: false,
        },
        {
          model: KelasFormal,
          as: 'kelasFormal',
          attributes: ['id_kelas', 'nama_kelas'],
          required: false,
        },
        {
          model: TahunAjaran,
          as: 'tahunAjaran',
          attributes: ['id_tahunajaran', 'tahun_ajaran'],
          required: false,
        },
        {
          model: AppResource,
          as: 'creator',
          attributes: ['resource_id', 'full_name', 'username'],
          required: false,
        },
      ],
      where,
    };

    return Model.findAndCountAll(query);
  }

  public detail(condition: any) {
    return Model.findOne({
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'fullname', 'nis'],
          required: false,
        },
        {
          model: KelasMda,
          as: 'kelasMda',
          attributes: ['id_kelas_mda', 'nama_kelas_mda'],
          required: false,
        },
        {
          model: KelasFormal,
          as: 'kelasFormal',
          attributes: ['id_kelas', 'nama_kelas'],
          required: false,
        },
        {
          model: TahunAjaran,
          as: 'tahunAjaran',
          attributes: ['id_tahunajaran', 'tahun_ajaran'],
          required: false,
        },
        {
          model: AppResource,
          as: 'creator',
          attributes: ['resource_id', 'full_name', 'username'],
          required: false,
        },
        {
          model: AppResource,
          as: 'updater',
          attributes: ['resource_id', 'full_name', 'username'],
          required: false,
        },
      ],
      where: condition,
    });
  }

  public async create(data: any, transaction?: any) {
    return Model.bulkCreate(data.payload, { transaction });
  }

  public update(data: any, transaction?: any) {
    return Model.update(data?.payload, {
      where: data?.condition,
      transaction,
      individualHooks: true,
    });
  }

  public delete(data: any, transaction?: any) {
    return Model.destroy({
      where: data?.condition,
      transaction,
      individualHooks: true,
    });
  }
}

export const repository = new Repository();
