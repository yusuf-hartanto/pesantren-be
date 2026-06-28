'use strict';

import { Op, Sequelize } from 'sequelize';
import RapotSantri from './rapot.santri.model';
import Santri from '../santri/santri.model';
import AppResource from '../resource/resource.model';

export default class Repository {
  public list(data: any) {
    const query: any = {
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'fullname', 'nis'],
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

    console.warn(data);
    if (data?.tahun) {
      const tahun = `%${data.tahun.toLowerCase()}%`;
      where[Op.and] = [
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('RapotSantri.tahun_ajaran')),
          {
            [Op.like]: tahun,
          }
        ),
      ];
    }

    if (data?.semester) {
      const semester = `%${data.semester.toLowerCase()}%`;
      where[Op.and] = [
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('RapotSantri.semester')),
          {
            [Op.like]: semester,
          }
        ),
      ];
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

  public detail(condition: any) {
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
