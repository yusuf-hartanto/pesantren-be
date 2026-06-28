'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './pegawai.absen.harian.model';
import Pegawai from '../pegawai/pegawai.model';
import JamKerjaPegawai from '../pegawai.jam.kerja/pegawai.jam.kerja.model';
import Lokasi from '../location/location.model';
import GeoArea from '../geo.areas/geo.areas.model';

export default class Repository {
  public list(data: any) {
    let query: any = {
      order: [
        ['tanggal', 'DESC'],
        ['created_at', 'DESC'],
      ],
      include: [
        {
          model: Pegawai,
          as: 'pegawai',
          attributes: ['id_pegawai', 'nama_lengkap', 'nik', 'nip'],
          required: false,
        },
        {
          model: JamKerjaPegawai,
          as: 'jamKerjaPegawai',
          required: false,
          include: [
            { model: Lokasi, as: 'lokasiKerja', attributes: ['nama_lokasi'] },
          ],
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
                Sequelize.col('AbsenHarianPegawai.status_kehadiran'),
                'TEXT'
              )
            ),
            { [Op.like]: keyword }
          ),
        ],
      };
    }

    return Model.findAll(query);
  }

  public async index(data: any) {
    const query: any = {
      order: [['tanggal', 'DESC']],
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
          model: JamKerjaPegawai,
          as: 'jamKerjaPegawai',
          required: false,
        },
      ],
      where: {},
    };

    if (data?.id_pegawai) {
      query.where.id_pegawai = data.id_pegawai;
    }

    if (data?.tanggal) {
      query.where.tanggal = data.tanggal;
    }

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
            Sequelize.cast(
              Sequelize.col('AbsenHarianPegawai.status_kehadiran'),
              'text'
            )
          ),
          { [Op.like]: keyword }
        ),
      ];
    }

    return await Model.findAndCountAll(query);
  }

  public detail(condition: any, trx?: any) {
    return Model.findOne({
      include: [
        { model: Pegawai, as: 'pegawai' },
        { model: JamKerjaPegawai, as: 'jamKerjaPegawai' },
      ],
      where: condition,
      transaction: trx,
    });
  }

  public async findAttendanceToday(idPegawai: string, tanggal: string) {
    return await Model.findOne({
      where: {
        id_pegawai: idPegawai,
        tanggal: tanggal,
      },
    });
  }

  public async getActiveGeoLocation(idLokasi: string) {
    return await GeoArea.findOne({
      where: {
        id_lokasi: idLokasi,
        is_active: true,
      },
    });
  }

  public async create(payloads: any[], trx?: any) {
    return await Model.bulkCreate(payloads, { transaction: trx });
  }

  public update(data: any, trx?: any) {
    return Model.update(data?.payload, {
      where: data?.condition,
      transaction: trx,
    });
  }

  public async upsertAbsen(payload: any, trx?: any) {
    return await Model.bulkCreate([payload as Record<string, any>], {
      transaction: trx,
      updateOnDuplicate: ['keterangan_masuk', 'status_kehadiran', 'created_by'],
    });
  }

  public async delete(condition: any) {
    return Model.destroy({
      where: condition,
    });
  }

  public async removeAbsenByRangeDate(
    id_pegawai: string,
    startDate: string,
    endDate: string,
    transaction: any
  ) {
    return await Model.destroy({
      where: {
        id_pegawai,
        tanggal: {
          [Op.between]: [startDate, endDate],
        },
      },
      transaction,
    });
  }

  public async listForExport(params: {
    q?: string;
    isTemplate?: boolean;
    limit?: number;
    id_pegawai?: string;
  }) {
    const { q, isTemplate, limit, id_pegawai } = params;
    const keyword = q ? `%${q}%` : null;
    let whereClause: any = {};

    if (id_pegawai) {
      whereClause.id_pegawai = id_pegawai;
    }

    if (!isTemplate && keyword) {
      const keywordLower = keyword.toLowerCase();
      whereClause[Op.or] = [
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('pegawai.nama_lengkap')),
          { [Op.like]: keywordLower }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(Sequelize.col('pegawai.nik'), 'TEXT')
          ),
          { [Op.like]: keywordLower }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(
              Sequelize.col('AbsenHarianPegawai.status_kehadiran'),
              'TEXT'
            )
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
          model: Pegawai,
          as: 'pegawai',
          attributes: ['id_pegawai', 'nama_lengkap', 'nik'],
        },
      ],
      order: [['tanggal', 'DESC']],
    });
  }

  public async insertImport(payloads: any[]) {
    const trx = await Model.sequelize?.transaction();
    try {
      for (const item of payloads) {
        const existing = await Model.findOne({
          where: { id_pegawai: item.id_pegawai, tanggal: item.tanggal },
          transaction: trx,
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
