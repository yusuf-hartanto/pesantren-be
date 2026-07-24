'use strict';

import { Op, Sequelize } from 'sequelize';
import RapotSantri from './rapot.santri.model';
import Santri from '../santri/santri.model';
import AppResource from '../resource/resource.model';
import Cabang from '../cabang/cabang.model';
import PenempatanKelasSantri from '../penempatan.kelas.santri/penempatan.kelas.santri.model';
import KelasMda from '../kelas.mda/kelas.mda.model';
import KelasFormal from '../kelas.formal/kelas.formal.model';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';
import LembagaPendidikanFormal from '../lembaga.pendidikan.formal/lembaga.pendidikan.formal.model';
import LembagaPendidikanKepesantrenan from '../lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.model';
import { getUserContextData } from '../../../context/userContext';

export default class Repository {
  public list(data: any) {
    const userContext = getUserContextData();
    
    const query: any = {
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'fullname', 'nis'],
          include: [
            {
              model: PenempatanKelasSantri,
              as: 'penempatanKelas',
              required: false,
              on: Sequelize.literal(
                `"santri->penempatanKelas".id_santri = "santri".id_santri AND "santri->penempatanKelas".id_tahun_ajaran = (
                  SELECT id_tahunajaran
                  FROM tahun_ajaran
                  WHERE tahun_ajaran = "RapotSantri".tahun_ajaran
                  LIMIT 1
                )`
              ),
              include: [
                {
                  model: KelasMda,
                  as: 'kelasMda',
                  attributes: ['id_kelas_mda', 'nama_kelas_mda'],
                  include: [
                    {
                      model: LembagaPendidikanKepesantrenan,
                      as: 'lembaga',
                      attributes: ['id_lembaga', 'nama_lembaga', 'id_cabang'],
                    },
                  ],
                },
                {
                  model: KelasFormal,
                  as: 'kelasFormal',
                  attributes: ['id_kelas', 'nama_kelas'],
                  include: [
                    {
                      model: LembagaPendidikanFormal,
                      as: 'lembaga',
                      attributes: ['id_lembaga', 'nama_lembaga', 'id_cabang'],
                    },
                  ],
                },
              ],
            },
            {
              model: Cabang,
              as: 'cabang',
              attributes: ['id_cabang', 'nama_cabang'],
              required: false,
            },
          ],
        },
      ],
      where: {},
    };

    if (data?.id_santri) {
      query.where.id_santri = data.id_santri;
    }

    if (data?.status) {
      query.where.status = data.status;
    }
    
    if (userContext && userContext?.id_cabang) {
      query.where['$santri.id_cabang$'] = userContext.id_cabang;
    }

    if (userContext && userContext?.id_lembaga) {
      query.where[Op.and] = [
        {
          [Op.or]: [
            { '$santri.id_lembaga_formal$': userContext.id_lembaga },
            { '$santri.id_lembaga_mda$': userContext.id_lembaga },
          ],
        }
      ];
    }

    return RapotSantri.findAll(query);
  }

  public index(data: any) {
    const santriAttributes = ['id_santri', 'fullname', 'nis', 'nik', 'gender'];
    if (data?.isOpenApi) {
      santriAttributes.push(
        'id_santri_sitrendi',
        'id_wali_sitrendi',
        'institution_id_sitrendi'
      );
    }

    const userContext = getUserContextData();
    const where: any = {};
    if (data?.id_santri) {
      where.id_santri = data.id_santri;
    }

    if (data?.id_santri_sitrendi) {
      where['$santri.id_santri_sitrendi$'] = data.id_santri_sitrendi;
    }

    if (data?.status) {
      where.status = data.status;
    }

    if (data?.id_cabang && data?.id_cabang != '') {
      where['$santri.id_cabang$'] = data?.id_cabang;
    } else if (userContext && userContext?.id_cabang) {
      where['$santri.id_cabang$'] = userContext.id_cabang;
    }

    const whereAnd: any[] = [];

    if (data?.tahun) {
      const tahun = `%${data.tahun.toLowerCase()}%`;
      whereAnd.push(
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('RapotSantri.tahun_ajaran')),
          {
            [Op.like]: tahun,
          }
        )
      );
    }

    if (data?.semester) {
      const semester = `%${data.semester.toLowerCase()}%`;
      whereAnd.push(
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('RapotSantri.semester')),
          {
            [Op.like]: semester,
          }
        )
      );
    }

    if (data?.id_kelas && data?.id_kelas != '') {
      whereAnd.push(
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('RapotSantri.tahun_ajaran')),
          Op.eq,
          Sequelize.fn('LOWER', Sequelize.col('santri->penempatanKelas->tahunAjaran.tahun_ajaran'))
        )
      );
      whereAnd.push({
        [Op.or]: [
          { '$santri.penempatanKelas.id_kelas_formal$': data.id_kelas },
          { '$santri.penempatanKelas.id_kelas_mda$': data.id_kelas },
        ],
      });
    } else if (userContext && userContext?.id_lembaga) {
      whereAnd.push({
        [Op.or]: [
          { '$santri.id_lembaga_formal$': userContext.id_lembaga },
          { '$santri.id_lembaga_mda$': userContext.id_lembaga },
        ],
      });
    }

    if (whereAnd.length > 0) {
      where[Op.and] = whereAnd;
    }

    if (data?.keyword) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      where[Op.or] = [
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('santri.fullname')),
          {
            [Op.like]: keyword,
          }
        ),
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('santri.nis')), {
          [Op.like]: keyword,
        }),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('RapotSantri.tahun_ajaran')),
          {
            [Op.like]: keyword,
          }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('RapotSantri.semester')),
          {
            [Op.like]: keyword,
          }
        ),
      ];
    }

    const query: any = {
      order: [['created_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      subQuery: false,
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: santriAttributes,
          include: [
            {
              model: PenempatanKelasSantri,
              as: 'penempatanKelas',
              required: false,
              on: Sequelize.literal(
                `"santri->penempatanKelas".id_santri = "santri".id_santri AND "santri->penempatanKelas".id_tahun_ajaran = (
                  SELECT id_tahunajaran
                  FROM tahun_ajaran
                  WHERE tahun_ajaran = "RapotSantri".tahun_ajaran
                  LIMIT 1
                )`
              ),
              include: [
                {
                  model: KelasMda,
                  as: 'kelasMda',
                  attributes: ['id_kelas_mda', 'nama_kelas_mda'],
                  include: [
                    {
                      model: LembagaPendidikanKepesantrenan,
                      as: 'lembaga',
                      attributes: ['id_lembaga', 'nama_lembaga', 'id_cabang'],
                    },
                  ],
                },
                {
                  model: KelasFormal,
                  as: 'kelasFormal',
                  attributes: ['id_kelas', 'nama_kelas'],
                  include: [
                    {
                      model: LembagaPendidikanFormal,
                      as: 'lembaga',
                      attributes: ['id_lembaga', 'nama_lembaga', 'id_cabang'],
                    },
                  ],
                },
                {
                  model: TahunAjaran,
                  as: 'tahunAjaran',
                  attributes: ['id_tahunajaran', 'tahun_ajaran'],
                },
              ],
            },
            {
              model: Cabang,
              as: 'cabang',
              attributes: ['id_cabang', 'nama_cabang'],
              required: false,
            },
          ],
        },
        {
          model: AppResource,
          as: 'creator',
          attributes: ['resource_id', 'full_name', 'username'],
        },
        {
          model: AppResource,
          as: 'updater',
          attributes: ['resource_id', 'full_name', 'username'],
        },
      ],
      where,
    };

    return RapotSantri.findAndCountAll(query);
  }

  public detail(condition: any, trx?: any) {
    return RapotSantri.findOne({
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'fullname', 'nis'],
        },
        {
          model: AppResource,
          as: 'creator',
          attributes: ['resource_id', 'full_name', 'username'],
        },
        {
          model: AppResource,
          as: 'updater',
          attributes: ['resource_id', 'full_name', 'username'],
        },
      ],
      where: condition,
      transaction: trx,
    });
  }

  public async archivePreviousRapots(id_santri: string, transaction?: any) {
    return await RapotSantri.update(
      { status: 'Arsip' },
      {
        where: { id_santri, status: 'Aktif' },
        transaction,
      }
    );
  }

  public async create(data: any, transaction?: any) {
    return await RapotSantri.create(data?.payload, { transaction });
  }

  public async update(data: any, transaction?: any) {
    return await RapotSantri.update(data?.payload, {
      where: data?.condition,
      transaction,
      individualHooks: true,
    });
  }

  public async delete(data: any, transaction?: any) {
    return await RapotSantri.destroy({
      where: data?.condition,
      transaction,
      individualHooks: true,
    });
  }
}

export const repository = new Repository();
