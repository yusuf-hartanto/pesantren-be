'use strict';

import { Op } from 'sequelize';
import Model from './location.model';
import { helper } from '../../../helpers/helper';
import { number } from 'zod';
import Cabang from '../cabang/cabang.model';

export default class Repository {
  public list(data: any, limit?: number) {
    let query: any = {
      order: [['id_lokasi', 'DESC']],
      include: [
        {
          model: Model,
          as: 'parent',
          attributes: ['id_lokasi', 'nama_lokasi', 'kode_lokasi'],
          required: false,
        },
      ],
    };
    
    if (limit) {
      query.limit = limit;
    }

    const keyword = data?.keyword ? `%${data.keyword}%` : null;

    if (keyword) {
      query.where = {
        nama_lokasi: { [Op.like]: keyword },
      };
    }

    return Model.findAll(query);
  }

  /**
   * Khusus untuk Export: Mengambil semua data dengan relasi induk dan cabang
   */
  public listForExport(condition: any, limit?: number) {
    return Model.findAll({
      where: condition,
      limit,
      include: [
        {
          model: Model,
          as: 'parent',
          attributes: ['id_lokasi', 'nama_lokasi', 'kode_lokasi'],
          required: false,
        },
        {
          model: Model,
          as: 'sub_lokasi', 
          attributes: ['id_lokasi', 'nama_lokasi', 'kode_lokasi'],
          required: false,
        },
        {
          model: Cabang,
          as: 'cabang',
          attributes: ['id_cabang', 'nama_cabang'],
          required: false,
        }
      ],
      order: [['id_lokasi', 'ASC']]
    });
  }

  public async index(data: any) {
    let query: any = {
      order: [['id_lokasi', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      subQuery: false,
      include: [
        {
          model: Model,
          as: 'parent',
          attributes: ['id_lokasi', 'nama_lokasi'],
          required: false,
        },
      ],
    };

    const keyword = data?.keyword ? `%${data.keyword}%` : null;

    if (keyword) {
      query.where = {
        [Op.or]: [
          { nama_lokasi: { [Op.like]: keyword } },
          { jenis_lokasi: { [Op.like]: keyword } },
          { kode_lokasi: { [Op.like]: keyword } },
          { keterangan: { [Op.like]: keyword } },
          { '$parent.nama_lokasi$': { [Op.like]: keyword } },
        ],
      };
    }

    return Model.findAndCountAll(query);
  }

  public checkDuplicate(payload: any) {
    return Model.findOne({
      where: {
        nama_lokasi: payload.nama_lokasi,
        jenis_lokasi: payload.jenis_lokasi,
        id_cabang: payload.id_cabang || null,
        // Jika kode_lokasi berbeda berarti ini adalah data lain yang duplikat
        kode_lokasi: { [Op.ne]: payload.kode_lokasi }
      }
    });
  }

  public detail(condition: any) {
    return Model.findOne({
      include: [
        {
          model: Model,
          as: 'parent',
          attributes: ['id_lokasi', 'nama_lokasi', 'kode_lokasi', 'parent_id'],
          required: false,
        },
        {
          model: Model,
          as: 'sub_lokasi',
          required: false,
        }
      ],
      where: {
        ...condition,
      },
    });
  }

  /**
   * Mencari lokasi berdasarkan nama secara case-insensitive
   * Digunakan pada proses Import untuk mencari Parent ID / Cabang ID
   */
  public findParentByName(name: string) {
    return Model.findOne({
      where: Model.sequelize?.where(
        Model.sequelize.fn('LOWER', Model.sequelize.col('nama_lokasi')),
        name.toLowerCase().trim()
      ),
      attributes: ['id_lokasi', 'nama_lokasi', 'id_cabang']
    });
  }

  /**
   * Mencari cabang di tabel Cabang
   */
  public findCabangByName(name: string) {
    return Cabang.findOne({
      where: Cabang.sequelize?.where(
        Cabang.sequelize.fn('LOWER', Cabang.sequelize.col('nama_cabang')), // Sesuaikan nama kolom di tabel cabang
        name.toLowerCase().trim()
      ),
      attributes: ['id_cabang', 'nama_cabang']
    });
  }

  /**
   * Logika Upsert untuk Import:
   * Jika kode_lokasi sudah ada, maka update. Jika tidak, maka create.
   */
  public async upsertImport(payload: any, transaction: any = null) {
    const existing = await Model.findOne({
      where: { kode_lokasi: payload.kode_lokasi },
      transaction
    });

    if (existing) {
      return await existing.update(
        { 
          ...payload, 
          updated_at: helper.date() 
        }, 
        { transaction }
      );
    } else {
      return await Model.create(
        { 
          ...payload, 
          created_at: helper.date() 
        }, 
        { transaction }
      );
    }
  }

  public async create(data: any) {
    // payload bisa berupa single object atau array untuk bulkCreate
    return Model.bulkCreate(Array.isArray(data.payload) ? data.payload : [data.payload]);
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