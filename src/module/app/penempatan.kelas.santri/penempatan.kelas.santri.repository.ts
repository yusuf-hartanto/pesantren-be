'use strict';

import { Op, Sequelize } from 'sequelize';
import Santri from '../santri/santri.model';
import KelasMda from '../kelas.mda/kelas.mda.model';
import KelasFormal from '../kelas.formal/kelas.formal.model';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';
import AppResource from '../resource/resource.model';
import Model from './penempatan.kelas.santri.model';
import { getUserContextData } from '../../../context/userContext';

export default class Repository {
  public list(data: any) {
    const query: any = {
      order: [['updated_at', 'DESC']],
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'fullname', 'nis'],
          where: {
            status: { [Op.ne]: 9 },
          },
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

    if (data?.id_tahun_ajaran) {
      query.where.id_tahun_ajaran = data.id_tahun_ajaran;
    }

    if (data?.id_kelas_formal) {
      query.where.id_kelas_formal = data.id_kelas_formal;
    }

    if (data?.id_kelas_mda) {
      query.where.id_kelas_mda = data.id_kelas_mda;
    }

    const santriInclude = query.include.find((inc: any) => inc.as === 'santri');
    if (santriInclude && data?.status_santri) {
      santriInclude.where = {
        status: data.status_santri,
      };
    }

    const andConditions: any[] = [];

    if (data?.q) {
      const keyword = `%${data.q.toLowerCase()}%`;
      andConditions.push({
        [Op.or]: [
          Sequelize.where(
            Sequelize.fn(
                'LOWER',
                Sequelize.cast(
                  Sequelize.col('PenempatanKelasSantri.status'),
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
            Sequelize.fn('LOWER', Sequelize.col('kelasMda.nama_kelas_mda')),
            {
              [Op.like]: keyword,
            }
          ),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('kelasFormal.nama_kelas')),
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
        ]
      })
    }

    const userContext = getUserContextData();
    if (userContext && userContext?.id_lembaga) {
      andConditions.push({
        [Op.or]: [
          { '$kelasMda.id_lembaga$': userContext?.id_lembaga },
          { '$kelasFormal.id_lembaga$': userContext?.id_lembaga },
        ]
      });
    }

    if (andConditions.length > 0) {
      query.where[Op.and] = andConditions;
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

    if (data?.id_tahun_ajaran) {
      where.id_tahun_ajaran = data.id_tahun_ajaran;
    }

    if (data?.id_kelas_formal) {
      where.id_kelas_formal = data.id_kelas_formal;
    }

    if (data?.id_kelas_mda) {
      where.id_kelas_mda = data.id_kelas_mda;
    }

    if (data?.keyword) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      where[Op.or] = [
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(
              Sequelize.col('PenempatanKelasSantri.status'),
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
          Sequelize.fn('LOWER', Sequelize.col('kelasMda.nama_kelas_mda')),
          {
            [Op.like]: keyword,
          }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('kelasFormal.nama_kelas')),
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
      ];
    }

    const userContext = getUserContextData();
    if (userContext && userContext?.id_lembaga) {
      where[Op.or] = [
        { '$kelasMda.id_lembaga$': userContext?.id_lembaga },
        { '$kelasFormal.id_lembaga$': userContext?.id_lembaga },
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
          attributes: ['id_santri', 'fullname', 'nis', 'nik', 'status'],
          where: {
            status: data?.status_santri ? data.status_santri : { [Op.ne]: 9 },
          },
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
