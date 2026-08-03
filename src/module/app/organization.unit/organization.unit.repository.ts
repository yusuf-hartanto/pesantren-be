'use strict';

import { QueryTypes, Sequelize, WhereOptions } from 'sequelize';
import Model from './organization.unit.model';
import { rawQuery } from '../../../helpers/rawQuery';
import Cabang from '../cabang/cabang.model';
import { Op } from 'sequelize';
import { getUserContextData } from '../../../context/userContext';

export default class Repository {
  public async list(data: any) {
    const keyword = data?.keyword ? `%${data.keyword.toLowerCase()}%` : null;
    const userContext = getUserContextData();
    const idCabangFilter = data?.id_cabang || userContext?.id_cabang || null;

    // Gunakan array untuk menampung kondisi
    const conditions = ['o.deleted_at IS NULL'];
    if (keyword) {
      conditions.push(`LOWER(o.nama_orgunit) LIKE :keyword`);
    }
    if (idCabangFilter) {
      conditions.push(`o.id_cabang = :id_cabang`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const query = `
          SELECT
            o.id_orgunit, o.nama_orgunit, o.lembaga_type,
            p.id_orgunit AS parent_id, p.nama_orgunit AS parent_nama,
            c.id_cabang, c.nama_cabang,
            CASE 
                WHEN o.lembaga_type = 'FORMAL' THEN json_build_object('id_lembaga', lf.id_lembaga, 'nama_lembaga', lf.nama_lembaga)
                WHEN o.lembaga_type = 'PESANTREN' THEN json_build_object('id_lembaga', lp.id_lembaga, 'nama_lembaga', lp.nama_lembaga)
            END AS lembaga
          FROM orgunit o
          LEFT JOIN orgunit p ON o.parent_id = p.id_orgunit
          LEFT JOIN cabang c ON o.id_cabang = c.id_cabang
          LEFT JOIN lembaga_pendidikan_formal lf ON o.id_lembaga = lf.id_lembaga AND o.lembaga_type = 'FORMAL'
          LEFT JOIN lembaga_pendidikan_kepesantrenan lp ON o.id_lembaga = lp.id_lembaga AND o.lembaga_type = 'PESANTREN'
          ${whereClause}
          ORDER BY o.nama_orgunit ASC
        `;

    const conn = await rawQuery.getConnection();
    return await conn.query(query, {
      type: QueryTypes.SELECT,
      replacements: {
        keyword,
        id_cabang: idCabangFilter,
      },
    });
  }

  public async index(data: {
    keyword?: string;
    offset?: number;
    limit?: number;
  }) {
    const keyword = data?.keyword ? `%${data.keyword.toLowerCase()}%` : null;
    const userContext = getUserContextData();

    // Satukan deleted_at dengan filter keyword
    const conditions = ['o.deleted_at IS NULL'];
    if (keyword) {
      conditions.push(`(
        LOWER(o.id_orgunit::text) LIKE :keyword OR
        LOWER(o.nama_orgunit) LIKE :keyword OR
        LOWER(o.level_orgunit::text) LIKE :keyword OR
        LOWER(o.jenis_orgunit::text) LIKE :keyword OR
        LOWER(o.keterangan) LIKE :keyword OR
        LOWER(p.nama_orgunit) LIKE :keyword OR
        LOWER(c.nama_cabang) LIKE :keyword OR
        LOWER(lf.nama_lembaga) LIKE :keyword OR
        LOWER(lp.nama_lembaga) LIKE :keyword
      )`);
    }
    if (userContext && userContext?.id_cabang) {
      conditions.push(`o.id_cabang = :id_cabang`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const limitOffset = `${data?.limit ? `LIMIT ${data.limit}` : ''} ${data?.offset ? `OFFSET ${data.offset}` : ''}`;

    const queryData = `
            SELECT o.*, p.id_orgunit AS parent_id, p.nama_orgunit AS parent_nama, c.nama_cabang,
                CASE 
                    WHEN o.lembaga_type = 'FORMAL' THEN json_build_object('id_lembaga', lf.id_lembaga, 'nama_lembaga', lf.nama_lembaga)
                    WHEN o.lembaga_type = 'PESANTREN' THEN json_build_object('id_lembaga', lp.id_lembaga, 'nama_lembaga', lp.nama_lembaga)
                END AS lembaga
            FROM orgunit o
            LEFT JOIN orgunit p ON o.parent_id = p.id_orgunit
            LEFT JOIN cabang c ON o.id_cabang = c.id_cabang
            LEFT JOIN lembaga_pendidikan_formal lf ON o.id_lembaga = lf.id_lembaga AND o.lembaga_type = 'FORMAL'
            LEFT JOIN lembaga_pendidikan_kepesantrenan lp ON o.id_lembaga = lp.id_lembaga AND o.lembaga_type = 'PESANTREN'
            ${whereClause}
            ORDER BY o.created_at DESC
            ${limitOffset}
        `;

    const queryCount = `
            SELECT COUNT(*) AS total FROM orgunit o
            LEFT JOIN orgunit p ON o.parent_id = p.id_orgunit
            LEFT JOIN cabang c ON o.id_cabang = c.id_cabang
            LEFT JOIN lembaga_pendidikan_formal lf ON o.id_lembaga = lf.id_lembaga AND o.lembaga_type = 'FORMAL'
            LEFT JOIN lembaga_pendidikan_kepesantrenan lp ON o.id_lembaga = lp.id_lembaga AND o.lembaga_type = 'PESANTREN'
            ${whereClause}
        `;

    const conn = await rawQuery.getConnection();
    const [dataResult, countResult] = await Promise.all([
      conn.query(queryData, {
        type: QueryTypes.SELECT,
        replacements: {
          keyword,
          id_cabang: userContext?.id_cabang || null,
        },
      }),
      conn.query<any>(queryCount, {
        type: QueryTypes.SELECT,
        replacements: {
          keyword,
          id_cabang: userContext?.id_cabang || null,
        },
      }),
    ]);

    return {
      rows: dataResult,
      count: parseInt(countResult[0]?.total || '0', 10),
    };
  }

  public async detail(condition: { id_orgunit?: string }) {
    const conditions = ['o.deleted_at IS NULL'];

    if (condition.id_orgunit) {
      conditions.push(`o.id_orgunit::text = :id_orgunit`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const queryData = `
            SELECT o.*, p.id_orgunit AS parent_id, p.nama_orgunit AS parent_nama, c.nama_cabang,
                CASE 
                    WHEN o.lembaga_type = 'FORMAL' THEN json_build_object('id_lembaga', lf.id_lembaga, 'nama_lembaga', lf.nama_lembaga)
                    WHEN o.lembaga_type = 'PESANTREN' THEN json_build_object('id_lembaga', lp.id_lembaga, 'nama_lembaga', lp.nama_lembaga)
                END AS lembaga
            FROM orgunit o
            LEFT JOIN orgunit p ON o.parent_id = p.id_orgunit
            LEFT JOIN cabang c ON o.id_cabang = c.id_cabang
            LEFT JOIN lembaga_pendidikan_formal lf ON o.id_lembaga = lf.id_lembaga AND o.lembaga_type = 'FORMAL'
            LEFT JOIN lembaga_pendidikan_kepesantrenan lp ON o.id_lembaga = lp.id_lembaga AND o.lembaga_type = 'PESANTREN'
            ${whereClause}
            LIMIT 1
        `;

    const conn = await rawQuery.getConnection();
    const dataResult = await conn.query(queryData, {
      type: QueryTypes.SELECT,
      replacements: condition,
    });

    return dataResult.length > 0 ? dataResult[0] : null;
  }

  public async checkHasChildren(parentId: string) {
    const count = await Model.count({ where: { parent_id: parentId } });
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

  public listForExport(params: {
    q?: string;
    isTemplate?: boolean;
    limit?: number;
  }) {
    const { q, isTemplate, limit } = params;
    const keyword = q ? `%${q.toLowerCase()}%` : null;
    const userContext = getUserContextData();

    let whereClause: any = {};

    if (userContext && userContext?.id_cabang) {
      whereClause.id_cabang = userContext.id_cabang;
    }

    if (!isTemplate && keyword) {
      whereClause = [
        { deleted_at: null },
        ...(userContext && userContext?.id_cabang
          ? [{ id_cabang: userContext.id_cabang }]
          : []),
        {
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(
                  Sequelize.col('OrganizationUnit.id_orgunit'),
                  'text'
                )
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(
                  Sequelize.col('OrganizationUnit.level_orgunit'),
                  'text'
                )
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(
                  Sequelize.col('OrganizationUnit.jenis_orgunit'),
                  'text'
                )
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.col('OrganizationUnit.nama_orgunit')
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(
                  Sequelize.col('OrganizationUnit.keterangan'),
                  'TEXT'
                )
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('cabang.nama_cabang')),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('parent.nama_orgunit')),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.col('lembagaPendidikanFormal.nama_lembaga')
              ),
              { [Op.like]: keyword }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.col('lembagaPendidikanKepesantrenan.nama_lembaga')
              ),
              { [Op.like]: keyword }
            ),
          ],
        },
      ];
    }

    return Model.findAll({
      where: whereClause,
      limit: limit || (isTemplate ? 5 : undefined),
      subQuery: false,
      include: [
        { model: Cabang, as: 'cabang', attributes: ['nama_cabang'] },
        { model: Model, as: 'parent', attributes: ['nama_orgunit'] },
        {
          model:
            require('../lembaga.pendidikan.formal/lembaga.pendidikan.formal.model')
              .default,
          as: 'lembagaPendidikanFormal',
          attributes: ['nama_lembaga'],
          required: false,
        },
        {
          model:
            require('../lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.model')
              .default,
          as: 'lembagaPendidikanKepesantrenan',
          attributes: ['nama_lembaga'],
          required: false,
        },
      ],

      order: [
        ['level_orgunit', 'ASC'],
        ['nama_orgunit', 'ASC'],
      ],
    });
  }

  public findByName(
    name: string,
    id_cabang: string,
    id_lembaga?: string | null,
    lembaga_type?: string | null
  ) {
    return Model.findOne({
      where: {
        nama_orgunit: Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('OrganizationUnit.nama_orgunit')),
          name.trim().toLowerCase()
        ),
        id_cabang,
        id_lembaga: id_lembaga || null,
        lembaga_type: lembaga_type || null,
      },
    });
  }

  public async upsertImport(payload: any, transaction: any = null) {
    const existing = await this.findByName(
      payload.nama_orgunit,
      payload.id_cabang,
      payload.id_lembaga,
      payload.lembaga_type
    );

    if (existing) {
      return await existing.update(payload, { transaction });
    } else {
      return await Model.create(payload, { transaction });
    }
  }

  public async insertImport(payloads: any[]) {
    const trx = await Model.sequelize?.transaction();
    try {
      for (const item of payloads) {
        await this.upsertImport(item, trx);
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
