'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './pegawai.jam.kerja.model';
import Pegawai from '../pegawai/pegawai.model';
import Lokasi from '../location/location.model';

export default class Repository {
  
  public list(data: any) {
    let query: any = {
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Pegawai,
          as: 'pegawai',
          attributes: ['id_pegawai', 'nama_lengkap', 'nik', 'nip'],
          required: false,
        },
        {
          model: Lokasi,
          as: 'lokasiKerja',
          attributes: ['id_lokasi', 'nama_lokasi'],
          required: false,
        },
      ],
    };

    const keyword = data?.keyword ? `%${data.keyword}%` : null;
    if (keyword) {
      query.where = {
        [Op.or]: [
          { '$pegawai.nama_lengkap$': { [Op.iLike]: keyword } },
          { keterangan: { [Op.iLike]: keyword } }
        ]
      };
    }

    return Model.findAll(query);
  }

  public async checkDuplicatePegawai(idPegawai: string, excludeIdJamKerja?: string) {
    const where: any = { id_pegawai: idPegawai };
    if (excludeIdJamKerja) {
      where.id_jamkerja = { [Op.ne]: excludeIdJamKerja };
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
          model: Pegawai,
          as: 'pegawai',
          attributes: ['id_pegawai', 'nama_lengkap', 'nik', 'nip'],
          required: false,
        },
        {
          model: Lokasi,
          as: 'lokasiKerja',
          attributes: ['id_lokasi', 'nama_lokasi'],
          required: false,
        },
      ],
      where: {},
    };

    const keyword = data?.keyword ? `%${data.keyword}%` : null;

    if (keyword) {
      query.where[Op.or] = [
        { '$pegawai.nama_lengkap$': { [Op.iLike]: keyword } },
        { '$pegawai.nik$': { [Op.iLike]: keyword } },
        { '$pegawai.nip$': { [Op.iLike]: keyword } },
        { '$lokasiKerja.nama_lokasi$': { [Op.iLike]: keyword } },
        { keterangan: { [Op.iLike]: keyword } },
        Sequelize.where(
          Sequelize.cast(Sequelize.col('JamKerjaPegawai.is_active'), 'text'),
          { [Op.iLike]: keyword }
        ),
      ];
    }

    return await Model.findAndCountAll(query);
  }

  public detail(condition: any) {
    return Model.findOne({
      include: [
        { model: Pegawai, as: 'pegawai' },
        { model: Lokasi, as: 'lokasiKerja' },
      ],
      where: condition,
    });
  }

  public async create(payloads: any[]) {
    return await Model.bulkCreate(payloads);
  }

  public update(data: any) {
    return Model.update(data?.payload, {
      where: data?.condition,
    });
  }

  public async delete(condition: any) {
    return Model.destroy({
      where: condition,
    });
  }

  public async listForExport(params: { q?: string; isTemplate?: boolean; limit?: number }) {
    const { q, isTemplate, limit } = params;
    const keyword = q ? `%${q}%` : null;

    let whereClause: any = {};

    if (!isTemplate && keyword) {
      whereClause[Op.or] = [
        { '$pegawai.nama_lengkap$': { [Op.iLike]: keyword } },
        { '$lokasiKerja.nama_lokasi$': { [Op.iLike]: keyword } },
        { keterangan: { [Op.iLike]: keyword } },
      ];
    }

    return Model.findAll({
      where: whereClause,
      limit: limit || (isTemplate ? 5 : undefined),
      subQuery: false,
      include: [
        { model: Pegawai, as: 'pegawai', attributes: ['id_pegawai', 'nama_lengkap'] },
        { model: Lokasi, as: 'lokasiKerja', attributes: ['id_lokasi', 'nama_lokasi'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  public async insertImport(payloads: any[]) {
    const trx = await Model.sequelize?.transaction();
    try {
      for (const item of payloads) {
        // Cek apakah pegawai ini sudah punya master jam kerja di sistem
        const existing = await Model.findOne({
          where: { id_pegawai: item.id_pegawai },
          transaction: trx,
        });

        if (existing) {
          // Jika sudah ada, timpa data acuan lamanya (Upsert Behavior)
          await existing.update(item, { transaction: trx });
        } else {
          // Jika belum ada, buat entitas master baru
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