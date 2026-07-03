'use strict';

import { Op, Sequelize, col, fn, literal, where } from 'sequelize';
import Model from './log.gate.santri.model';
import PerizinanSantri from '../perizinan.santri/perizinan.santri.model';
import Santri from '../santri/santri.model';
import Location from '../location/location.model';

export default class Repository {
  /**
   * Helper internal konstruktor WHERE clause kondisi perizinan santri native SQL
   */
  private buildKondisiFilter(status: string) {
    // Buat kondisi dasar yang selalu sama untuk semua status
    const kondisiDasar = {
      status_gate: 'Kembali',
      waktu_masuk: { [Op.ne]: null },
    };

    if (status === 'Normal') {
      return {
        ...kondisiDasar,
        [Op.and]: [
          where(
            fn('DATE', col('waktu_masuk')),
            '=',
            fn('DATE', col('perizinanSantri.tanggal_selesai'))
          ),
        ],
      };
    }

    if (status === 'Closed') {
      return {
        ...kondisiDasar,
        [Op.and]: [
          where(
            fn('DATE', col('waktu_masuk')),
            '<',
            fn('DATE', col('perizinanSantri.tanggal_selesai'))
          ),
        ],
      };
    }

    if (status === 'Overdue') {
      return {
        ...kondisiDasar,
        [Op.and]: [
          where(
            fn('DATE', col('waktu_masuk')),
            '>',
            fn('DATE', col('perizinanSantri.tanggal_selesai'))
          ),
        ],
      };
    }

    return {};
  }

  /**
   * Mengolah baris database murni dan menyisipkan status kondisi tanpa memecah/merusak total jumlah baris data
   */
  private mapTransformRows(rows: any[]) {
    return rows.map((item: any) => {
      const raw = item.toJSON();
      let kondisiDisplay = '-';

      // Kondisi hanya dihitung jika santri telah kembali (waktu_masuk terisi)
      if (
        raw.status_gate === 'Kembali' &&
        raw.waktu_masuk &&
        raw.perizinanSantri?.tanggal_selesai
      ) {
        const tglMasuk = new Date(raw.waktu_masuk).setHours(0, 0, 0, 0);
        const tglSelesai = new Date(
          raw.perizinanSantri.tanggal_selesai
        ).setHours(0, 0, 0, 0);

        if (tglMasuk === tglSelesai) kondisiDisplay = 'Normal';
        else if (tglMasuk < tglSelesai) kondisiDisplay = 'Closed';
        else kondisiDisplay = 'Overdue';
      }

      return {
        ...raw,
        nama_santri: raw.perizinanSantri?.santri?.fullname || '-',
        nis: raw.perizinanSantri?.santri?.nis || '-',
        kamar: raw.perizinanSantri?.lokasiKamar?.nama_lokasi || '-',
        jenis_izin: raw.perizinanSantri?.jenis_izin || '-',
        kondisi: kondisiDisplay,
      };
    });
  }

  public async list(data: any) {
    const query: any = {
      order: [['id_gate', 'DESC']],
      include: [
        {
          model: PerizinanSantri,
          as: 'perizinanSantri',
          include: [
            { model: Santri, as: 'santri', attributes: ['fullname', 'nis'] },
            { model: Location, as: 'lokasiKamar', attributes: ['nama_lokasi'] },
          ],
        },
      ],
    };
    const rows = await Model.findAll(query);
    return this.mapTransformRows(rows);
  }

  public async checkDuplicate(
    field: string,
    value: string,
    excludeId?: string
  ) {
    const where: any = { [field]: value };
    if (excludeId) {
      where.id_gate = { [Op.ne]: excludeId };
    }
    return await Model.findOne({ where });
  }

  public async index(data: any) {
    const andConditions: any[] = [];

    const query: any = {
      order: [['created_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      subQuery: false,
      include: [
        {
          model: PerizinanSantri,
          as: 'perizinanSantri',
          required: true,
          include: [
            { model: Santri, as: 'santri', attributes: ['fullname', 'nis'] },
            { model: Location, as: 'lokasiKamar', attributes: ['nama_lokasi'] },
          ],
        },
      ],
      where: {},
    };

    if (data?.date) {
      andConditions.push({
        [Op.or]: [
          {
            waktu_keluar: {
              [Op.between]: [`${data.date} 00:00:00`, `${data.date} 23:59:59`],
            },
          },
          {
            waktu_masuk: {
              [Op.between]: [`${data.date} 00:00:00`, `${data.date} 23:59:59`],
            },
          },
        ],
      });
    }

    if (data?.status && data?.status !== 'Semua') {
      andConditions.push(this.buildKondisiFilter(data.status));
    }

    const keyword = data?.keyword ? `%${data.keyword.toLowerCase()}%` : null;
    if (keyword) {
      andConditions.push({
        [Op.or]: [
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.col('perizinanSantri.santri.fullname')
            ),
            {
              [Op.like]: keyword,
            }
          ),
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(
                Sequelize.col('perizinanSantri.santri.nis'),
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
              Sequelize.col('perizinanSantri.lokasiKamar.nama_lokasi')
            ),
            {
              [Op.like]: keyword,
            }
          ),
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(Sequelize.col('LogGateSantri.keterangan'), 'TEXT')
            ),
            {
              [Op.like]: keyword,
            }
          ),
        ],
      });
    }

    if (andConditions.length > 0) {
      query.where = { [Op.and]: andConditions };
    }

    const result = await Model.findAndCountAll(query);

    return {
      count: result.count,
      rows: this.mapTransformRows(result.rows),
    };
  }

  public async getSummary(filters: { date?: string; status?: string }) {
    const andConditions: any[] = [];

    if (filters?.date) {
      andConditions.push({
        [Op.or]: [
          {
            waktu_keluar: {
              [Op.between]: [
                `${filters.date} 00:00:00`,
                `${filters.date} 23:59:59`,
              ],
            },
          },
          {
            waktu_masuk: {
              [Op.between]: [
                `${filters.date} 00:00:00`,
                `${filters.date} 23:59:59`,
              ],
            },
          },
        ],
      });
    }

    if (filters?.status && filters?.status !== 'Semua') {
      andConditions.push(this.buildKondisiFilter(filters.status));
    }

    const baseWhereClause =
      andConditions.length > 0 ? { [Op.and]: andConditions } : {};

    const baseInclude = [
      { model: PerizinanSantri, as: 'perizinanSantri', required: true },
    ];
    const needsInclude = !!(filters?.status && filters?.status !== 'Semua');

    const totalScan = await Model.count({
      where: baseWhereClause,
      include: needsInclude ? baseInclude : undefined,
    });

    const totalKeluar = await Model.count({
      where: {
        [Op.and]: [
          baseWhereClause,
          {
            waktu_keluar: { [Op.ne]: null },
          },
        ],
      },
      include: needsInclude ? baseInclude : undefined,
    });

    const totalMasuk = await Model.count({
      where: {
        [Op.and]: [baseWhereClause, { waktu_masuk: { [Op.ne]: null } }],
      },
      include: needsInclude ? baseInclude : undefined,
    });

    // Kondisi pembantu khusus untuk kalkulasi ketepatan waktu (wajib sudah masuk pondok)
    const kondisiSudahMasuk = {
      waktu_masuk: { [Op.ne]: null },
    };

    // Hitung Kategori Kedisiplinan (Normal, Closed, Overdue) berdasarkan waktu_masuk
    const normal = await Model.count({
      where: {
        [Op.and]: [
          baseWhereClause,
          kondisiSudahMasuk,
          where(
            fn('DATE', col('waktu_masuk')),
            '=',
            fn('DATE', col('perizinanSantri.tanggal_selesai'))
          ),
        ],
      },
      include: baseInclude,
    });

    const closed = await Model.count({
      where: {
        [Op.and]: [
          baseWhereClause,
          kondisiSudahMasuk,
          where(
            fn('DATE', col('waktu_masuk')),
            '<',
            fn('DATE', col('perizinanSantri.tanggal_selesai'))
          ),
        ],
      },
      include: baseInclude,
    });

    const overdue = await Model.count({
      where: {
        [Op.and]: [
          baseWhereClause,
          kondisiSudahMasuk,
          where(
            fn('DATE', col('waktu_masuk')),
            '>',
            fn('DATE', col('perizinanSantri.tanggal_selesai'))
          ),
        ],
      },
      include: baseInclude,
    });

    return { totalScan, totalKeluar, totalMasuk, normal, closed, overdue };
  }

  public detail(condition: any) {
    return Model.findOne({
      include: [
        {
          model: PerizinanSantri,
          as: 'perizinanSantri',
          include: [
            { model: Santri, as: 'santri' },
            { model: Location, as: 'lokasiKamar' },
          ],
        },
      ],
      where: condition,
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

  public async delete(condition: any) {
    return Model.destroy({
      where: condition,
    });
  }

  public async listForExport(params: {
    q?: string;
    isTemplate?: boolean;
    limit?: number;
    date?: string;
    status?: string;
  }) {
    const { q, isTemplate, limit, date, status } = params;

    // Samakan struktur andConditions dengan fungsi index agar hasil export sinkron dengan tabel UI
    const andConditions: any[] = [];

    const query: any = {
      limit: limit || (isTemplate ? 5 : undefined),
      subQuery: false,
      include: [
        {
          model: PerizinanSantri,
          as: 'perizinanSantri',
          include: [
            { model: Santri, as: 'santri', attributes: ['fullname', 'nis'] },
            { model: Location, as: 'lokasiKamar', attributes: ['nama_lokasi'] },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      where: {},
    };

    if (date) {
      andConditions.push({
        [Op.or]: [
          {
            waktu_keluar: {
              [Op.between]: [`${date} 00:00:00`, `${date} 23:59:59`],
            },
          },
          {
            waktu_masuk: {
              [Op.between]: [`${date} 00:00:00`, `${date} 23:59:59`],
            },
          },
        ],
      });
    }

    if (status && status !== 'Semua') {
      andConditions.push(this.buildKondisiFilter(status));
    }

    const keyword = q ? `%${q.toLowerCase()}%` : null;
    if (!isTemplate && keyword) {
      andConditions.push({
        [Op.or]: [
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.col('perizinanSantri.santri.fullname')
            ),
            {
              [Op.like]: keyword,
            }
          ),
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(
                Sequelize.col('perizinanSantri.santri.nis'),
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
              Sequelize.col('perizinanSantri.lokasiKamar.nama_lokasi')
            ),
            {
              [Op.like]: keyword,
            }
          ),
        ],
      });
    }

    // 4. Gabungkan seluruh filter ke property query.where menggunakan Op.and
    if (andConditions.length > 0) {
      query.where = { [Op.and]: andConditions };
    }

    const rows = await Model.findAll(query);
    return this.mapTransformRows(rows);
  }

  public async insertImport(payloads: any[]) {
    const trx = await Model.sequelize?.transaction();
    try {
      for (const item of payloads) {
        const existing = await Model.findOne({
          where: { id_izin: item.id_izin },
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
