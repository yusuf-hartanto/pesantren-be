'use strict';

import { QueryTypes } from 'sequelize';
import Model from './organization.unit.model';
import { rawQuery } from '../../../helpers/rawQuery';

export default class Repository {
  public async list(data: any) {
    const keyword = data?.keyword ? `%${data.keyword}%` : null;

    // Gunakan array untuk menampung kondisi
    const conditions = ['o.deleted_at IS NULL'];
    if (keyword) {
      conditions.push(`o.nama_orgunit ILIKE :keyword`);
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
          ORDER BY o.created_at DESC
        `;

    const conn = await rawQuery.getConnection();
    return await conn.query(query, {
      type: QueryTypes.SELECT,
      replacements: { keyword },
    });
  }

  public async index(data: { keyword?: string; offset?: number; limit?: number }) {
    const keyword = data?.keyword ? `%${data.keyword}%` : null;

    // Satukan deleted_at dengan filter keyword
    const conditions = ['o.deleted_at IS NULL'];
    if (keyword) {
      conditions.push(`(
        o.id_orgunit::text ILIKE :keyword OR
        o.nama_orgunit ILIKE :keyword OR
        o.level_orgunit::text ILIKE :keyword OR
        o.jenis_orgunit ILIKE :keyword OR
        o.keterangan ILIKE :keyword OR
        p.nama_orgunit ILIKE :keyword OR
        c.nama_cabang ILIKE :keyword OR
        lf.nama_lembaga ILIKE :keyword OR
        lp.nama_lembaga ILIKE :keyword
      )`);
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
      conn.query(queryData, { type: QueryTypes.SELECT, replacements: { keyword } }),
      conn.query<any>(queryCount, { type: QueryTypes.SELECT, replacements: { keyword } }),
    ]);

    return { rows: dataResult, count: parseInt(countResult[0]?.total || '0', 10) };
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
}

export const repository = new Repository();
