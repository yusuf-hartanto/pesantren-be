'use strict';

import { Op, QueryTypes, Sequelize } from 'sequelize';
import Model from './jenis.penilaian.bobot.model';
import { rawQuery } from '../../../helpers/rawQuery';

export default class Repository {
	public async validateBobotLogic(data: any, id_bobot?: string) {
		const { id_penilaian, lembaga_type, id_lembaga, id_tingkat, id_tahunajaran, bobot, status } = data;

		// 1. Validasi Unik: Kombinasi data tidak boleh ganda
		const existingRecord = await Model.findOne({
			where: {
				id_penilaian,
				lembaga_type,
				id_lembaga,
				id_tingkat: id_tingkat || null,
				id_tahunajaran,
				id_bobot: id_bobot ? { [Op.ne]: id_bobot } : { [Op.ne]: null }
			}
		});

		if (existingRecord) {
			throw new Error('Kombinasi penilaian untuk lembaga, tingkat, dan tahun ajaran ini sudah ada.');
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
					id_bobot: id_bobot ? { [Op.ne]: id_bobot } : { [Op.ne]: null }
				}
			});

			const currentTotal = otherBobots.reduce((sum, item) => sum + parseFloat(item.bobot.toString()), 0);
			const newTotal = currentTotal + parseFloat(bobot);

			if (newTotal > 100) {
				throw new Error(`Total bobot melebihi 100% (Saat ini: ${currentTotal}%, Ditambah: ${bobot}% = ${newTotal}%).`);
			}
		}
	}

	public async list(data: any) {
		const keyword = data?.keyword ? `%${data.keyword}%` : null;

		const whereClause = keyword ? `WHERE jp.singkatan ILIKE :keyword` : '';

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
			replacements: {
				keyword,
			},
		});

		return results;
	}

	public async index(data: {
		keyword?: string;
		offset?: number;
		limit?: number;
	}) {
		// 1. Persiapkan Parameter
		const keyword = data?.keyword ? `%${data.keyword}%` : null;
		const limit = data?.limit ? parseInt(data.limit.toString(), 10) : 10;
		const offset = data?.offset ? parseInt(data.offset.toString(), 10) : 0;

		// 2. WHERE Clause Lengkap (Soft Delete + Keyword Filter)
		// Gunakan casting ::TEXT pada ENUM (lembaga_type, status) dan DECIMAL (bobot)
		const whereClause = `
        WHERE jpb.deleted_at IS NULL
        ${keyword ? `AND (
            jp.singkatan ILIKE :keyword OR
            jpb.lembaga_type::TEXT ILIKE :keyword OR
            t.tingkat ILIKE :keyword OR
            ta.tahun_ajaran ILIKE :keyword OR
            jpb.bobot::TEXT ILIKE :keyword OR
            jpb.status::TEXT ILIKE :keyword OR
            lf.nama_lembaga ILIKE :keyword OR
            lp.nama_lembaga ILIKE :keyword
        )` : ''}
    `;

		// 3. Query Data Utama
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

		// 4. Query Count (Sama dengan WHERE Clause data utama)
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

			// 5. Eksekusi secara paralel untuk performa maksimal
			const [dataResult, countResult]: [any[], any[]] = await Promise.all([
				conn.query(queryData, {
					type: QueryTypes.SELECT,
					replacements: { keyword, limit, offset },
				}),
				conn.query(queryCount, {
					type: QueryTypes.SELECT,
					replacements: { keyword },
				}),
			]);

			const total = parseInt(countResult[0]?.total || '0', 10);

			return {
				rows: dataResult,
				count: total,
			};
		} catch (error: any) {
			throw new Error(`Repository Jenis Penilaian Bobot Index: ${error.message}`);
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
}

export const repository = new Repository();
