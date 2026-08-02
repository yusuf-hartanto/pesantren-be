'use strict';

import { Op, Sequelize, QueryTypes } from 'sequelize';
import Model from './kebersihan.inspeksi.model';
import Pegawai from '../pegawai/pegawai.model';
import Cabang from '../cabang/cabang.model';
import Lokasi from '../location/location.model';
import JadwalInspeksiKebersihan from '../jadwal.inspeksi.kebersihan/jadwal.inspeksi.kebersihan.model';
import KebersihanTemuan from '../kebersihan.temuan/kebersihan.temuan.model';
import { rawQuery } from '../../../helpers/rawQuery';
import moment from 'moment';
import { getUserContextData } from '../../../context/userContext';

export default class Repository {
  public list(data: any) {
    let query: any = {
      order: [['created_at', 'DESC']],
    };

    if (data?.kode_slot != '') {
      query = {
        ...query,
        where: {
          kode_slot: { [Op.eq]: data?.kode_slot },
        },
      };
    }

    const userContext = getUserContextData();
    if (userContext && userContext?.id_cabang) {
      query.where = {
        ...query.where,
        id_cabang: userContext?.id_cabang,
      };
    }

    return Model.findAll({
      ...query,
      include: [
        {
          model: Cabang,
          as: 'cabang',
          required: false,
          attributes: ['id_cabang', 'nama_cabang'],
        },
        {
          model: Lokasi,
          as: 'lokasi',
          required: false,
          attributes: ['id_lokasi', 'nama_lokasi'],
        },
        {
          model: JadwalInspeksiKebersihan,
          as: 'jadwal_inspeksi_kebersihan',
          required: false,
          attributes: ['id_jadwal', 'hari'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: KebersihanTemuan,
          as: 'temuans',
          required: false,
          attributes: [
            'id_temuan',
            'kategori',
            'deskripsi',
            'tingkat',
            'perlu_tindak_lanjut',
            'foto_path',
            'created_at',
          ],
        },
      ],
    });
  }

  public index(data: any) {
    let where: any = {};

    // Filter keyword
    if (data?.keyword) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      where[Op.or] = [
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(
              Sequelize.col('KebersihanInspeksi.kode_slot'),
              'TEXT'
            )
          ),
          {
            [Op.like]: keyword,
          }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.col('KebersihanInspeksi.catatan_umum')
          ),
          {
            [Op.like]: keyword,
          }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('cabang.nama_cabang')),
          {
            [Op.like]: keyword,
          }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('lokasi.nama_lokasi')),
          {
            [Op.like]: keyword,
          }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('pegawai.nama_lengkap')),
          {
            [Op.like]: keyword,
          }
        ),
      ];
    }

    // Filter status
    if (data?.status) {
      where.status_kondisi = data.status;
    }

    // Filter cabang
    if (data?.id_cabang) {
      where.id_cabang = data.id_cabang;
    }

    // Filter lokasi
    if (data?.id_lokasi) {
      where.id_lokasi = data.id_lokasi;
    }

    // Filter tanggal
    if (data?.tanggal_awal && data?.tanggal_akhir) {
      where.tanggal = {
        [Op.between]: [data.tanggal_awal, data.tanggal_akhir],
      };
    } else if (data?.tanggal_awal) {
      where.tanggal = {
        [Op.gte]: data.tanggal_awal,
      };
    } else if (data?.tanggal_akhir) {
      where.tanggal = {
        [Op.lte]: data.tanggal_akhir,
      };
    }

    const userContext = getUserContextData();
    if (userContext && userContext?.id_cabang) {
      where.id_cabang = userContext?.id_cabang;
    }

    let query: any = {
      order: [['created_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      where,
      distinct: true,
      subQuery: false,
    };

    return Model.findAndCountAll({
      ...query,
      include: [
        {
          model: Cabang,
          as: 'cabang',
          required: false,
          attributes: ['id_cabang', 'nama_cabang'],
        },
        {
          model: Lokasi,
          as: 'lokasi',
          required: false,
          attributes: ['id_lokasi', 'nama_lokasi'],
        },
        {
          model: JadwalInspeksiKebersihan,
          as: 'jadwal_inspeksi_kebersihan',
          required: false,
          attributes: ['id_jadwal', 'hari'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: KebersihanTemuan,
          as: 'temuans',
          required: false,
          attributes: [
            'id_temuan',
            'kategori',
            'deskripsi',
            'tingkat',
            'perlu_tindak_lanjut',
            'foto_path',
            'created_at',
            'status',
            'foto_path_tindakan',
          ],
        },
      ],
    });
  }

  public detail(condition: any) {
    return Model.findOne({
      where: {
        ...condition,
      },
      include: [
        {
          model: Cabang,
          as: 'cabang',
          required: false,
          attributes: ['id_cabang', 'nama_cabang'],
        },
        {
          model: Lokasi,
          as: 'lokasi',
          required: false,
          attributes: ['id_lokasi', 'nama_lokasi'],
        },
        {
          model: JadwalInspeksiKebersihan,
          as: 'jadwal_inspeksi_kebersihan',
          required: false,
          attributes: ['id_jadwal', 'hari', 'kode_slot'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: KebersihanTemuan,
          as: 'temuans',
          required: false,
          attributes: [
            'id_temuan',
            'kategori',
            'deskripsi',
            'tingkat',
            'perlu_tindak_lanjut',
            'foto_path',
            'created_at',
            'status',
            'foto_path_tindakan',
          ],
        },
      ],
    });
  }

  public async create(data: any) {
    return Model.create(data?.payload);
  }

  public update(data: any) {
    return Model.update(data?.payload, {
      where: data?.condition,
      individualHooks: true,
    });
  }

  public delete(data: any) {
    return Model.destroy({
      where: data?.condition,
      individualHooks: true,
    });
  }

  public async indexPetugasList(data: any) {
    const conn = await rawQuery.getConnection();
    const userContext = getUserContextData();
    const idCabangFilter = userContext?.id_cabang
      ? 'AND jik.id_cabang = :id_cabang'
      : '';
    const idCabangKiFilter = userContext?.id_cabang
      ? 'AND ki.id_cabang = :id_cabang'
      : '';

    const replacements: any = {
      startperiod: moment(data?.tanggal_awal).format('YYYY-MM-DD'),
      endperiod: moment(data?.tanggal_akhir).format('YYYY-MM-DD'),
      ...(userContext?.id_cabang ? { id_cabang: userContext.id_cabang } : {}),
    };

    let whereClause = '';
    if (data?.keyword) {
      replacements.keyword = `%${data.keyword.toLowerCase()}%`;
      whereClause = `WHERE LOWER(j.nama_lengkap) LIKE :keyword`;
    }

    const q = `
      WITH tanggal AS (
        SELECT generate_series(
            DATE :startperiod,
            DATE :endperiod,
            INTERVAL '1 day'
        )::date AS tanggal
      ),
      jadwal AS (
          SELECT
              t.tanggal,
              jik.id_petugas,
              p.nama_lengkap,
              jik.kode_slot
          FROM tanggal t
          JOIN jadwal_inspeksi_kebersihan jik
            ON jik.hari = EXTRACT(ISODOW FROM t.tanggal)
          JOIN pegawai p
            ON p.id_pegawai = jik.id_petugas
          WHERE jik.is_active = true
            ${idCabangFilter}
      ),
      temuan AS (
          SELECT
              kt.id_inspeksi,
              COUNT(*) AS jumlah_temuan
          FROM kebersihan_temuan kt
          GROUP BY kt.id_inspeksi
      )
      SELECT
          j.id_petugas,
          j.nama_lengkap,

          COUNT(DISTINCT (j.tanggal, j.kode_slot, j.id_petugas)) AS total_jadwal,

          COUNT(DISTINCT (j.tanggal, j.kode_slot, j.id_petugas)) FILTER (WHERE ki.id_inspeksi IS NOT NULL) AS inspeksi,

          COUNT(DISTINCT (j.tanggal, j.kode_slot, j.id_petugas)) FILTER (WHERE ki.id_inspeksi IS NULL) AS tidak_inspeksi,

          COALESCE(SUM(t.jumlah_temuan), 0) AS total_temuan

      FROM jadwal j
      LEFT JOIN kebersihan_inspeksi ki
            ON ki.tanggal = j.tanggal
            AND ki.kode_slot::text = j.kode_slot::text
            AND ki.id_petugas = j.id_petugas
            ${idCabangKiFilter}

      LEFT JOIN temuan t
            ON t.id_inspeksi = ki.id_inspeksi

      ${whereClause}
      GROUP BY
          j.id_petugas,
          j.nama_lengkap

      ORDER BY
          j.nama_lengkap
        `;

    const rows = await conn.query(q, {
      type: QueryTypes.SELECT,
      replacements,
    });

    return rows;
  }

  public async indexPetugas(data: any) {
    const conn = await rawQuery.getConnection();
    const userContext = getUserContextData();
    const idCabangFilter = userContext?.id_cabang
      ? 'AND jik.id_cabang = :id_cabang'
      : '';
    const idCabangKiFilter = userContext?.id_cabang
      ? 'AND ki.id_cabang = :id_cabang'
      : '';

    const replacements: any = {
      startperiod: moment(data?.tanggal_awal).format('YYYY-MM-DD'),
      endperiod: moment(data?.tanggal_akhir).format('YYYY-MM-DD'),
      ...(userContext?.id_cabang ? { id_cabang: userContext.id_cabang } : {}),
    };

    let whereClause = '';
    if (data?.keyword) {
      replacements.keyword = `%${data.keyword.toLowerCase()}%`;
      whereClause = `WHERE LOWER(j.nama_lengkap) LIKE :keyword`;
    }

    const limitOffset = [
      data?.limit != null ? `LIMIT ${data.limit}` : null,
      data?.offset != null ? `OFFSET ${data.offset}` : null,
    ]
      .filter(Boolean)
      .join(' ');

    const q = `
    WITH tanggal AS (
      SELECT generate_series(
          DATE :startperiod,
          DATE :endperiod,
          INTERVAL '1 day'
      )::date AS tanggal
    ),
    jadwal AS (
        SELECT
            t.tanggal,
            jik.id_petugas,
            p.nama_lengkap,
            jik.kode_slot
        FROM tanggal t
        JOIN jadwal_inspeksi_kebersihan jik
          ON jik.hari = EXTRACT(ISODOW FROM t.tanggal)
        JOIN pegawai p
          ON p.id_pegawai = jik.id_petugas
        WHERE jik.is_active = true
          ${idCabangFilter}
    ),
    temuan AS (
        SELECT
            kt.id_inspeksi,
            COUNT(*) AS jumlah_temuan
        FROM kebersihan_temuan kt
        GROUP BY kt.id_inspeksi
    )
    SELECT
        j.id_petugas,
        j.nama_lengkap,

        COUNT(DISTINCT (j.tanggal, j.kode_slot, j.id_petugas)) AS total_jadwal,

        COUNT(DISTINCT (j.tanggal, j.kode_slot, j.id_petugas)) FILTER (WHERE ki.id_inspeksi IS NOT NULL) AS inspeksi,

        COUNT(DISTINCT (j.tanggal, j.kode_slot, j.id_petugas)) FILTER (WHERE ki.id_inspeksi IS NULL) AS tidak_inspeksi,

        COALESCE(SUM(t.jumlah_temuan), 0) AS total_temuan

    FROM jadwal j
    LEFT JOIN kebersihan_inspeksi ki
          ON ki.tanggal = j.tanggal
          AND ki.kode_slot::text = j.kode_slot::text
          AND ki.id_petugas = j.id_petugas
          ${idCabangKiFilter}

    LEFT JOIN temuan t
          ON t.id_inspeksi = ki.id_inspeksi
    ${whereClause}
    GROUP BY
        j.id_petugas,
        j.nama_lengkap

    ORDER BY
        j.nama_lengkap
      ${limitOffset}
      `;

    const rows = await conn.query(q, {
      type: QueryTypes.SELECT,
      replacements,
    });

    const countQuery = `
    SELECT COUNT(*)::int AS count
    FROM (
        WITH tanggal AS (
      SELECT generate_series(
          DATE :startperiod,
          DATE :endperiod,
          INTERVAL '1 day'
      )::date AS tanggal
    ),
    jadwal AS (
        SELECT
            t.tanggal,
            jik.id_petugas,
            p.nama_lengkap,
            jik.kode_slot
        FROM tanggal t
        JOIN jadwal_inspeksi_kebersihan jik
          ON jik.hari = EXTRACT(ISODOW FROM t.tanggal)
        JOIN pegawai p
          ON p.id_pegawai = jik.id_petugas
        WHERE jik.is_active = true
          ${idCabangFilter}
    ),
    temuan AS (
        SELECT
            kt.id_inspeksi,
            COUNT(*) AS jumlah_temuan
        FROM kebersihan_temuan kt
        GROUP BY kt.id_inspeksi
    )
    SELECT
        j.id_petugas,
        j.nama_lengkap,

        COUNT(*) AS total_jadwal,

        COUNT(ki.id_inspeksi) AS inspeksi,

        COUNT(*) - COUNT(ki.id_inspeksi) AS tidak_inspeksi,

        COALESCE(SUM(t.jumlah_temuan), 0) AS total_temuan

    FROM jadwal j
    LEFT JOIN kebersihan_inspeksi ki
          ON ki.tanggal = j.tanggal
          AND ki.kode_slot::text = j.kode_slot::text
          AND ki.id_petugas = j.id_petugas
          ${idCabangKiFilter}

    LEFT JOIN temuan t
          ON t.id_inspeksi = ki.id_inspeksi
    ${whereClause}
    GROUP BY
        j.id_petugas,
        j.nama_lengkap
    ) x
    `;

    const [{ count }] = (await conn.query(countQuery, {
      type: QueryTypes.SELECT,
      replacements,
    })) as any[];

    return { count, rows };
  }
}

export const repository = new Repository();
