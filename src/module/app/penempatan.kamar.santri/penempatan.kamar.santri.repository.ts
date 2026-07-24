'use strict';

import { Op, Sequelize } from 'sequelize';
import Santri from '../santri/santri.model';
import Model from './penempatan.kamar.santri.model';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';
import Lokasi from '../location/location.model';
import { getUserContextData } from '../../../context/userContext';

export default class Repository {
  public list(data: any) {
    let query: any = {
      where: {
        is_deleted: false,
      },
      order: [['updated_at', 'DESC']],
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'fullname'],
          where: {
            status: { [Op.ne]: 9 },
          },
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

    if (data?.keyword && data?.keyword != undefined) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: {
          is_deleted: false,
          nama_kamar: Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(
                Sequelize.col('PenempatanKamarSantri.nama_kamar'),
                'TEXT'
              )
            ),
            { [Op.like]: keyword }
          ),
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(
                  Sequelize.col('PenempatanKamarSantri.status'),
                  'TEXT'
                )
              ),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('santri.fullname')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(Sequelize.col('santri.nis'), 'TEXT')
              ),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(Sequelize.col('santri.nik'), 'TEXT')
              ),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('tahunAjaran.tahun_ajaran')),
              {
                [Op.like]: keyword,
              }
            ),
          ],
        },
      };
    }

    const userContext = getUserContextData();
    if (userContext && userContext?.id_cabang) {
      query.where = {
        ...query.where,
        '$lokasi.id_cabang$': userContext?.id_cabang,
      };
    }

    if (data?.status) {
      query.where.status = data.status;
    }
    if (data?.id_lokasi) {
      query.where.id_lokasi = data.id_lokasi;
    }
    if (data?.id_tahunajaran) {
      query.where.id_tahunajaran = data.id_tahunajaran;
    }
    const santriInclude = query.include.find((inc: any) => inc.as === 'santri');
    if (santriInclude && data?.status_santri) {
      santriInclude.where = {
        status: data.status_santri,
      };
    }

    return Model.findAll(query);
  }

public async index(data: any) {
    let whereCondition: any = {
      is_deleted: false,
    };

    if (data?.id_lokasi) {
      whereCondition.id_lokasi = data.id_lokasi;
    }

    let query: any = {
      where: whereCondition,
      order: [['updated_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      subQuery: false,
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'fullname', 'nis', 'nik', 'status'],
          where: {
            status: data?.status_santri ? data.status_santri : { [Op.ne]: 9 },
          },
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
              attributes: [
                'id_lokasi',
                'kode_lokasi',
                'nama_lokasi',
                'parent_id',
              ],
              required: false,
            },
          ],
        },
        {
          model: TahunAjaran,
          as: 'tahunAjaran',
          attributes: ['id_tahunajaran', 'tahun_ajaran', 'keterangan'],
          required: false,
        },
      ],
    };

    if (data?.keyword && data?.keyword !== undefined) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query.where = {
        ...query.where, 
        [Op.or]: [
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(
                Sequelize.col('PenempatanKamarSantri.status'),
                'TEXT'
              )
            ),
            {
              [Op.iLike]: keyword,
            }
          ),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('santri.fullname')),
            {
              [Op.iLike]: keyword,
            }
          ),
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(Sequelize.col('santri.nis'), 'TEXT')
            ),
            {
              [Op.iLike]: keyword,
            }
          ),
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(Sequelize.col('santri.nik'), 'TEXT')
            ),
            {
              [Op.iLike]: keyword,
            }
          ),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('tahunAjaran.tahun_ajaran')),
            {
              [Op.iLike]: keyword,
            }
          ),
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(Sequelize.col('santri.nik'), 'TEXT')
            ),
            {
              [Op.like]: keyword,
            }
          ),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('tahunAjaran.tahun_ajaran')),
            {
              [Op.like]: keyword,
            }
          ),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('lokasi.nama_lokasi')),
            {
              [Op.like]: keyword,
            }
          )
        ]
      };
    }

    const userContext = getUserContextData();
    if (userContext && userContext?.id_cabang) {
      query.where = {
        ...query.where,
        '$lokasi.id_cabang$': userContext?.id_cabang,
      };
    }

    if (data?.status) {
      query.where.status = data.status;
    }
    if (data?.id_lokasi) {
      query.where.id_lokasi = data.id_lokasi;
    }
    if (data?.id_tahunajaran) {
      query.where.id_tahunajaran = data.id_tahunajaran;
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
