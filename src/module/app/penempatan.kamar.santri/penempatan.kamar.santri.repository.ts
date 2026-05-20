'use strict';

import { Op } from 'sequelize';
import Santri from '../santri/santri.model';
import Model from './penempatan.kamar.santri.model';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';
import Lokasi from '../location/location.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      where: {
        is_deleted: false,
      },
      order: [['updated_at', 'DESC']],
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'fullname'],
          required: false,
        },
        {
          model: Lokasi,
          as: 'lokasi',
          attributes: ['id_lokasi', 'nama_lokasi'],
          required: false,
        },
        {
          model: TahunAjaran,
          as: 'tahunAjaran',
          attributes: ['id_tahunajaran', 'tahun_ajaran'],
          required: false,
        },
      ],
    };

    const keyword = data?.keyword ? `%${data.keyword}%` : null;
    if (keyword) {
      query = {
        ...query,
        where: {
          is_deleted: false,
          nama_kamar: { [Op.like]: keyword },
        },
      };
    }

    return Model.findAll(query);
  }

  public async index(data: any) {
    let query: Object = {
      where: {
        is_deleted: false,
      },
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
          model: Lokasi,
          as: 'lokasi',
          attributes: ['id_lokasi', 'kode_lokasi', 'nama_lokasi', 'parent_id'],
          required: false,
          include: [
            {
              model: Lokasi,
              as: 'parent',
              attributes: ['id_lokasi', 'kode_lokasi', 'nama_lokasi', 'parent_id'],
              required: false,
            },
          ]
        },
        {
          model: TahunAjaran,
          as: 'tahunAjaran',
          attributes: ['id_tahunajaran', 'tahun_ajaran', 'keterangan'],
          required: false,
        },
      ],
    };

    const keyword = data?.keyword ? `%${data.keyword}%` : null;
    if (keyword) {
      query = {
        ...query,
        where: {
          is_deleted: false,
          [Op.or]: [
            { status: { [Op.like]: keyword } },
            { '$lokasi.nama_lokasi$': { [Op.like]: keyword } },
            { '$santri.fullname$': { [Op.like]: keyword } },
            { '$tahunAjaran.tahun_ajaran$': { [Op.like]: keyword } },
          ],
        },
      };

      return await Model.findAndCountAll(query);
    }

    return Model.findAndCountAll(query);
  }

  public detail(condition: any) {
    return Model.findOne({
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'fullname'],
          required: false,
        },
        {
          model: Lokasi,
          as: 'lokasi',
          attributes: ['id_lokasi', 'nama_lokasi'],
          required: false,
        },
        {
          model: TahunAjaran,
          as: 'tahunAjaran',
          attributes: ['id_tahunajaran', 'tahun_ajaran'],
          required: false,
        },
      ],
      where: {
        ...condition,
        is_deleted: false,
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
}

export const repository = new Repository();
