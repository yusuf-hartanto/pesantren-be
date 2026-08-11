'use strict';

import { Op, QueryTypes, Sequelize } from 'sequelize';
import Model from './jenis.penilaian.bobot.model';
import { rawQuery } from '../../../helpers/rawQuery';
import JenisPenilaian from '../jenis.penilaian/jenis.penilaian.model';
import Tingkat from '../tingkat/tingkat.model';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';
import { getUserContextData } from '../../../context/userContext';
import LembagaPendidikanFormal from '../lembaga.pendidikan.formal/lembaga.pendidikan.formal.model';
import LembagaPendidikanKepesantrenan from '../lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.model';

export default class Repository {
  public async validateBobotLogic(data: any, id_bobot?: string) {
    const {
      id_penilaian,
      lembaga_type,
      id_lembaga,
      id_tingkat,
      id_tahunajaran,
      bobot,
      status,
    } = data;

    // 1. Validasi Unik: Kombinasi data tidak boleh ganda
    const existingRecord = await Model.findOne({
      where: {
        id_penilaian,
        lembaga_type,
        id_lembaga,
        id_tingkat: id_tingkat || null,
        id_tahunajaran,
        id_bobot: id_bobot ? { [Op.ne]: id_bobot } : { [Op.ne]: null },
      },
    });

    if (existingRecord) {
      throw new Error(
        'Kombinasi penilaian untuk lembaga, tingkat, dan tahun ajaran ini sudah ada.'
      );
    }

    // 2. Validasi Total Bobot 100%
    // Hanya validasi jika statusnya 'Aktif'
    if (status === 'Aktif') {
      // Ambil semua bobot aktif lainnya dalam kelompok yang sama
      const otherBobots = await Model.findAll({
        where: {
          lembaga_type,
          id_lembaga,
          id_tingkat: id_tingkat || null,
          id_tahunajaran,
          status: 'Aktif',
          id_bobot: id_bobot ? { [Op.ne]: id_bobot } : { [Op.ne]: null },
        },
      });

      const currentTotal = otherBobots.reduce(
        (sum, item) => sum + parseFloat(item.bobot.toString()),
        0
      );
      const newTotal = currentTotal + parseFloat(bobot);

      if (newTotal > 100) {
        throw new Error(
          `Total bobot melebihi 100% (Saat ini: ${currentTotal}%, Ditambah: ${bobot}% = ${newTotal}%).`
        );
      }
    }
  }

  public async list(data: any) {
    const keyword = data?.keyword ? `%${data.keyword.toLowerCase()}%` : null;
    const userContext = getUserContextData();

    let whereConditions: string[] = [];
    let replacements: any = { keyword };

    if (keyword) {
      whereConditions.push(`LOWER(jp.singkatan) LIKE :keyword`);
    }

    if (userContext && userContext?.id_lembaga) {
      whereConditions.push(`jpb.id_lembaga = :id_lembaga`);
      replacements.id_lembaga = userContext.id_lembaga;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    const query = `
		SELECT 
			jpb.id_bobot,
			jp.id_penilaian,
			jp.singkatan as nama_penilaian,
			jpb.lembaga_type,
			CASE 
				WHEN jpb.lembaga_type = 'FORMAL' 
					THEN json_build_object('id_lembaga', lf.id_lembaga, 'nama_lembaga', lf.nama_lembaga)
				WHEN jpb.lembaga_type = 'PESANTREN' 
					THEN json_build_object('id_lembaga', lp.id_lembaga, 'nama_lembaga', lp.nama_lembaga)
			END AS lembaga,
			t.id_tingkat,
			t.tingkat,
			ta.id_tahunajaran,
			ta.tahun_ajaran,
			jpb.bobot,
			jpb.status
		FROM jenis_penilaian_bobot jpb
		LEFT JOIN jenis_penilaian jp ON jpb.id_penilaian = jp.id_penilaian
		LEFT JOIN lembaga_pendidikan_formal lf 
			ON jpb.id_lembaga = lf.id_lembaga AND jpb.lembaga_type = 'FORMAL'
		LEFT JOIN lembaga_pendidikan_kepesantrenan lp 
			ON jpb.id_lembaga = lp.id_lembaga AND jpb.lembaga_type = 'PESANTREN'
		LEFT JOIN tingkat t ON jpb.id_tingkat = t.id_tingkat
		LEFT JOIN tahun_ajaran ta ON jpb.id_tahunajaran = ta.id_tahunajaran
		${whereClause}
		ORDER BY jpb.id_bobot DESC
    `;

    const conn = await rawQuery.getConnection();
    const results = await conn.query(query, {
      type: QueryTypes.SELECT,
      replacements,
    });

    return results;
  }

  public async index(data: {
    keyword?: string;
    offset?: number;
    limit?: number;
  }) {
    const keyword = data?.keyword ? `%${data.keyword.toLowerCase()}%` : null;
    const limit = data?.limit ? parseInt(data.limit.toString(), 10) : 10;
    const offset = data?.offset ? parseInt(data.offset.toString(), 10) : 0;
    const userContext = getUserContextData();

    const replacements: any = { keyword };
    if (userContext && userContext?.id_lembaga) {
      replacements.id_lembaga = userContext.id_lembaga;
    }

    const whereClause = `
        WHERE jpb.deleted_at IS NULL
        ${
          userContext && userContext?.id_lembaga
            ? `AND jpb.id_lembaga = :id_lembaga`
            : ''
        }
        ${
          keyword
            ? `AND (
            LOWER(jp.singkatan) LIKE :keyword OR
            LOWER(jpb.lembaga_type::TEXT) LIKE :keyword OR
            LOWER(t.tingkat) LIKE :keyword OR
            LOWER(ta.tahun_ajaran) LIKE :keyword OR
            LOWER(jpb.bobot::TEXT) LIKE :keyword OR
            LOWER(jpb.status::TEXT) LIKE :keyword OR
            LOWER(lf.nama_lembaga) LIKE :keyword OR
            LOWER(lp.nama_lembaga) LIKE :keyword
        )`
            : ''
        }
    `;

    const queryData = `
        SELECT 
            jpb.id_bobot,
            jp.id_penilaian,
            jp.singkatan as nama_penilaian,
            jpb.lembaga_type,
            CASE 
                WHEN jpb.lembaga_type = 'FORMAL' 
                    THEN json_build_object('id_lembaga', lf.id_lembaga, 'nama_lembaga', lf.nama_lembaga)
                WHEN jpb.lembaga_type = 'PESANTREN' 
                    THEN json_build_object('id_lembaga', lp.id_lembaga, 'nama_lembaga', lp.nama_lembaga)
            END AS lembaga,
            t.id_tingkat,
            t.tingkat,
            ta.id_tahunajaran,
            ta.tahun_ajaran,
            jpb.bobot,
            jpb.status
        FROM jenis_penilaian_bobot jpb
        LEFT JOIN jenis_penilaian jp ON jpb.id_penilaian = jp.id_penilaian
        LEFT JOIN lembaga_pendidikan_formal lf 
            ON jpb.id_lembaga = lf.id_lembaga AND jpb.lembaga_type = 'FORMAL'
        LEFT JOIN lembaga_pendidikan_kepesantrenan lp 
            ON jpb.id_lembaga = lp.id_lembaga AND jpb.lembaga_type = 'PESANTREN'
        LEFT JOIN tingkat t ON jpb.id_tingkat = t.id_tingkat
        LEFT JOIN tahun_ajaran ta ON jpb.id_tahunajaran = ta.id_tahunajaran
        ${whereClause}
        ORDER BY jpb.id_bobot DESC
        LIMIT :limit OFFSET :offset
    `;

    const queryCount = `
        SELECT COUNT(*) AS total
        FROM jenis_penilaian_bobot jpb
        LEFT JOIN jenis_penilaian jp ON jpb.id_penilaian = jp.id_penilaian
        LEFT JOIN lembaga_pendidikan_formal lf 
            ON jpb.id_lembaga = lf.id_lembaga AND jpb.lembaga_type = 'FORMAL'
        LEFT JOIN lembaga_pendidikan_kepesantrenan lp 
            ON jpb.id_lembaga = lp.id_lembaga AND jpb.lembaga_type = 'PESANTREN'
        LEFT JOIN tingkat t ON jpb.id_tingkat = t.id_tingkat
        LEFT JOIN tahun_ajaran ta ON jpb.id_tahunajaran = ta.id_tahunajaran
        ${whereClause}
    `;

    try {
      const conn = await rawQuery.getConnection();

      const [dataResult, countResult]: [any[], any[]] = await Promise.all([
        conn.query(queryData, {
          type: QueryTypes.SELECT,
          replacements: { ...replacements, limit, offset },
        }),
        conn.query(queryCount, {
          type: QueryTypes.SELECT,
          replacements,
        }),
      ]);

      const total = parseInt(countResult[0]?.total || '0', 10);

      return {
        rows: dataResult,
        count: total,
      };
    } catch (error: any) {
      throw new Error(
        `Repository Jenis Penilaian Bobot Index: ${error.message}`
      );
    }
  }

  public async detail(condition: { id_bobot?: string }) {
    let whereConditions: string[] = [];

    if (condition.id_bobot) {
      whereConditions.push(`jpb.id_bobot::text = :id_bobot`);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    const queryData = `
			SELECT 
				jpb.id_bobot,
				jp.id_penilaian,
				jp.singkatan as nama_penilaian,
				jpb.lembaga_type,
				CASE 
					WHEN jpb.lembaga_type = 'FORMAL' 
						THEN json_build_object('id_lembaga', lf.id_lembaga, 'nama_lembaga', lf.nama_lembaga)
					WHEN jpb.lembaga_type = 'PESANTREN' 
						THEN json_build_object('id_lembaga', lp.id_lembaga, 'nama_lembaga', lp.nama_lembaga)
				END AS lembaga,
				t.id_tingkat,
				t.tingkat,
				ta.id_tahunajaran,
				ta.tahun_ajaran,
				jpb.bobot,
				jpb.status
			FROM jenis_penilaian_bobot jpb
			LEFT JOIN jenis_penilaian jp ON jpb.id_penilaian = jp.id_penilaian
			LEFT JOIN lembaga_pendidikan_formal lf 
				ON jpb.id_lembaga = lf.id_lembaga AND jpb.lembaga_type = 'FORMAL'
			LEFT JOIN lembaga_pendidikan_kepesantrenan lp 
				ON jpb.id_lembaga = lp.id_lembaga AND jpb.lembaga_type = 'PESANTREN'
			LEFT JOIN tingkat t ON jpb.id_tingkat = t.id_tingkat
			LEFT JOIN tahun_ajaran ta ON jpb.id_tahunajaran = ta.id_tahunajaran
			${whereClause}
			ORDER BY jpb.id_bobot DESC
			LIMIT 1
		`;

    const conn = await rawQuery.getConnection();

    const dataResult = await conn.query(queryData, {
      type: QueryTypes.SELECT,
      replacements: condition,
    });

    return dataResult;
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
    const keyword = q ? `%${q.toLowerCase()}%` : null;

    let whereClause: any = {};

    const userContext = getUserContextData();
    if (userContext && userContext?.id_lembaga) {
      whereClause.id_lembaga = userContext.id_lembaga;
    }

    if (!isTemplate && keyword) {
      whereClause[Op.or] = [
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.col('jenisPenilaian.jenis_pengujian')
          ),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('jenisPenilaian.singkatan')),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(
              Sequelize.col('JenisPenilaianBobot.lembaga_type'),
              'text'
            )
          ),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('tingkat.tingkat')),
          { [Op.like]: keyword }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('tahunAjaran.tahun_ajaran')),
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
          model: JenisPenilaian,
          as: 'jenisPenilaian',
          attributes: ['id_penilaian', 'jenis_pengujian', 'singkatan'],
        },
        {
          model: Tingkat,
          as: 'tingkat',
          attributes: ['id_tingkat', 'tingkat'],
        },
        {
          model: TahunAjaran,
          as: 'tahunAjaran',
          attributes: ['id_tahunajaran', 'tahun_ajaran'],
        },
        {
          model: LembagaPendidikanFormal,
          as: 'lembagaPendidikanFormal',
          attributes: ['id_lembaga', 'nama_lembaga'],
        },
        {
          model: LembagaPendidikanKepesantrenan,
          as: 'lembagaPendidikanKepesantrenan',
          attributes: ['id_lembaga', 'nama_lembaga'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  public async checkDuplicate(payload: any, id?: string) {
    const condition: any = {
      id_penilaian: payload.id_penilaian,
      id_tahunajaran: payload.id_tahunajaran,
      id_lembaga: payload.id_lembaga,
      id_tingkat: payload.id_tingkat || null,
      lembaga_type: payload.lembaga_type,
    };
    if (id) condition.id_bobot = { [Op.ne]: id };

    return Model.findOne({ where: condition });
  }

  public async insertImport(payloads: any[]) {
    const trx = await Model.sequelize?.transaction();
    try {
      for (const item of payloads) {
        const existing = await Model.findOne({
          where: {
            id_penilaian: item.id_penilaian,
            id_tahunajaran: item.id_tahunajaran,
            id_lembaga: item.id_lembaga,
            id_tingkat: item.id_tingkat || null,
            lembaga_type: item.lembaga_type,
          },
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
