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

    const keyword = data?.keyword ? `%${data.keyword}%` : null;
    if (keyword) {
      query.where = {
        [Op.or]: [
          { '$pegawai.nama_lengkap$': { [Op.iLike]: keyword } },
          { status_kehadiran: { [Op.iLike]: keyword } },
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

    const keyword = data?.keyword ? `%${data.keyword}%` : null;
    if (keyword) {
      query.where[Op.or] = [
        { '$pegawai.nama_lengkap$': { [Op.iLike]: keyword } },
        { '$pegawai.nik$': { [Op.iLike]: keyword } },
        Sequelize.where(
          Sequelize.cast(
            Sequelize.col('AbsenHarianPegawai.status_kehadiran'),
            'text'
          ),
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
        { model: JamKerjaPegawai, as: 'jamKerjaPegawai' },
      ],
      where: condition,
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
    id_pegawai?: string;
  }) {
    const { q, isTemplate, limit, id_pegawai } = params;
    const keyword = q ? `%${q}%` : null;
    let whereClause: any = {};

    if (id_pegawai) {
      whereClause.id_pegawai = id_pegawai;
    }

    if (!isTemplate && keyword) {
      whereClause[Op.or] = [
        { '$pegawai.nama_lengkap$': { [Op.iLike]: keyword } },
        { '$pegawai.nik$': { [Op.iLike]: keyword } },
        { status_kehadiran: { [Op.iLike]: keyword } },
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
