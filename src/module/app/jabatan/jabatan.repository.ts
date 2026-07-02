'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './jabatan.model';
import OrganizationUnit from '../organization.unit/organization.unit.model';
import Pegawai from '../pegawai/pegawai.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['id_jabatan', 'DESC']],
      include: [
        {
          model: OrganizationUnit,
          as: 'orgunit',
          attributes: ['id_orgunit', 'nama_orgunit'],
          required: false,
        },
      ],
    };

    const keyword = data?.keyword ? `%${data.keyword.toLowerCase()}%` : null;

    if (keyword) {
      query = {
        ...query,
        where: {
          nama_jabatan: Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('Jabatan.nama_jabatan')),
            {
              [Op.like]: keyword,
            }
          ),
        },
      };
    }

    return Model.findAll(query);
  }

  public async index(data: any) {
    let query: Object = {
      order: [['id_jabatan', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      subQuery: false,
      include: [
        {
          model: OrganizationUnit,
          as: 'orgunit',
          attributes: ['id_orgunit', 'nama_orgunit'],
          required: false,
        },
      ],
    };

    const keyword = data?.keyword ? `%${data.keyword.toLowerCase()}%` : null;

    if (keyword) {
      query = {
        ...query,
        where: {
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('Jabatan.nama_jabatan')),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(Sequelize.col('Jabatan.level_jabatan'), 'text')
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(Sequelize.col('Jabatan.sifat_jabatan'), 'text')
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(Sequelize.col('Jabatan.kode_jabatan'), 'text')
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(Sequelize.col('Jabatan.keterangan'), 'text')
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('orgunit.nama_orgunit')),
              { [Op.like]: keyword }
            ),
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
          model: OrganizationUnit,
          as: 'orgunit',
          attributes: ['id_orgunit', 'nama_orgunit'],
          required: false,
        },
      ],
      where: {
        ...condition,
      },
    });
  }

  public async checkUniqueInOrgunit(
    id_orgunit: string,
    field: 'nama_jabatan' | 'kode_jabatan',
    value: string,
    excludeId?: string
  ) {
    const condition: any = {
      id_orgunit,
      [field]: value,
      deleted_at: null,
    };

    if (excludeId) {
      condition.id_jabatan = { [Op.ne]: excludeId };
    }

    return await Model.findOne({ where: condition });
  }

  public async checkHasPegawai(id_jabatan: string) {
    const count = await Pegawai.count({ where: { id_jabatan } });
    return count > 0;
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

  public async listForExport(params: {
    q?: string;
    isTemplate?: boolean;
    limit?: number;
  }) {
    const { q, isTemplate, limit } = params;
    const keyword = q ? `%${q}%` : null;
    let whereClause: any = {};

    if (!isTemplate && keyword) {
      const keywordLower = keyword.toLowerCase();
      whereClause = {
        [Op.and]: [
          { deleted_at: null },
          {
            [Op.or]: [
              Sequelize.where(
                Sequelize.fn('LOWER', Sequelize.col('Jabatan.nama_jabatan')),
                { [Op.like]: keywordLower }
              ),
              Sequelize.where(
                Sequelize.fn(
                  'LOWER',
                  Sequelize.cast(Sequelize.col('Jabatan.kode_jabatan'), 'text')
                ),
                { [Op.like]: keywordLower }
              ),
              Sequelize.where(
                Sequelize.fn(
                  'LOWER',
                  Sequelize.cast(Sequelize.col('Jabatan.keterangan'), 'text')
                ),
                { [Op.like]: keywordLower }
              ),
              Sequelize.where(
                Sequelize.fn(
                  'LOWER',
                  Sequelize.cast(Sequelize.col('Jabatan.level_jabatan'), 'text')
                ),
                { [Op.like]: keywordLower }
              ),
              Sequelize.where(
                Sequelize.fn(
                  'LOWER',
                  Sequelize.cast(Sequelize.col('Jabatan.sifat_jabatan'), 'text')
                ),
                { [Op.like]: keywordLower }
              ),
              Sequelize.where(
                Sequelize.fn('LOWER', Sequelize.col('orgunit.nama_orgunit')),
                { [Op.like]: keywordLower }
              ),
            ],
          },
        ],
      };
    }

    return Model.findAll({
      where: whereClause,
      limit: limit || (isTemplate ? 5 : undefined),
      subQuery: false,
      include: [
        {
          model: OrganizationUnit,
          as: 'orgunit',
          attributes: ['nama_orgunit'],
          required: false, // LEFT OUTER JOIN
        },
      ],
      order: [
        ['level_jabatan', 'ASC'],
        ['nama_jabatan', 'ASC'],
      ],
    });
  }

  public findByName(name: string) {
    return Model.findOne({
      where: Model.sequelize?.where(
        Model.sequelize.fn('LOWER', Model.sequelize.col('nama_jabatan')),
        name.toLowerCase().trim()
      ),
    });
  }

  public async insertImport(payloads: any[]) {
    const trx = await Model.sequelize?.transaction();

    try {
      for (const item of payloads) {
        await this.upsertImport(item, trx);
      }

      if (trx) await trx.commit();
      return true;
    } catch (error) {
      if (trx) await trx.rollback();
      throw error;
    }
  }

  public async upsertImport(payload: any, transaction: any = null) {
    const existing = await this.findByName(payload.nama_jabatan);

    if (existing) {
      return await existing.update(
        {
          ...payload,
        },
        { transaction }
      );
    } else {
      return await Model.create(
        {
          ...payload,
          id_orgunit: '8de3cd2b-7f24-4870-b821-fd8cb5b3ba08',
        },
        { transaction }
      );
    }
  }
}

export const repository = new Repository();
