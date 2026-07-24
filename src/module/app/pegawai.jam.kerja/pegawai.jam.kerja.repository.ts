'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './pegawai.jam.kerja.model';
import Pegawai from '../pegawai/pegawai.model';
import Lokasi from '../location/location.model';
import { getUserContextData } from '../../../context/userContext';

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

    const keyword = data?.keyword ? `%${data.keyword.toLowerCase()}%` : null;
    if (keyword) {
      query.where = {
        [Op.or]: [
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('pegawai.nama_lengkap')),
            { [Op.like]: keyword }
          ),
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(
                Sequelize.col('JamKerjaPegawai.keterangan'),
                'TEXT'
              )
            ),
            { [Op.like]: keyword }
          ),
        ],
      };
    }

    const userContext = getUserContextData();
    if (userContext && userContext?.id_cabang) {
      query.where = {
        ...query.where,
        '$lokasiKerja.id_cabang$': userContext?.id_cabang,
      };
    }

    return Model.findAll(query);
  }

  public async checkDuplicatePegawai(
    idPegawai: string,
    excludeIdJamKerja?: string
  ) {
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

    const keyword = data?.keyword ? `%${data.keyword.toLowerCase()}%` : null;
    if (keyword) {
      query.where[Op.or] = [
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('pegawai.nama_lengkap')),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(Sequelize.col('pegawai.nik'), 'TEXT')
          ),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(Sequelize.col('pegawai.nip'), 'TEXT')
          ),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('lokasiKerja.nama_lokasi')),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(Sequelize.col('JamKerjaPegawai.keterangan'), 'TEXT')
          ),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(Sequelize.col('JamKerjaPegawai.is_active'), 'text')
          ),
          { [Op.like]: keyword }
        ),
      ];
    }

    const userContext = getUserContextData();
    if (userContext && userContext?.id_cabang) {
      query.where = {
        ...query.where,
        '$lokasiKerja.id_cabang$': userContext?.id_cabang,
      };
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

  public async listForExport(params: {
    q?: string;
    isTemplate?: boolean;
    limit?: number;
  }) {
    const { q, isTemplate, limit } = params;
    const keyword = q ? `%${q.toLowerCase()}%` : null;

    let whereClause: any = {};

    const userContext = getUserContextData();
    if (userContext && userContext?.id_cabang) {
      whereClause = {
        ...whereClause,
        '$lokasiKerja.id_cabang$': userContext?.id_cabang,
      };
    }

    if (!isTemplate && keyword) {
      whereClause[Op.or] = [
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('pegawai.nama_lengkap')),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('lokasiKerja.nama_lokasi')),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(Sequelize.col('JamKerjaPegawai.keterangan'), 'TEXT')
          ),
          { [Op.like]: keyword }
        ),
      ];
    }

    return Model.findAll({
      where: whereClause,
      limit: limit || (isTemplate ? 5 : undefined),
      subQuery: false,
      include: [
        {
          model: Pegawai,
          as: 'pegawai',
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: Lokasi,
          as: 'lokasiKerja',
          attributes: ['id_lokasi', 'nama_lokasi'],
        },
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
