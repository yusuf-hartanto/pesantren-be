'use strict';

import { Op, Sequelize } from 'sequelize';
import moment from 'moment';
import Model from './absen.kelas.santri.model';
import AppSantri from '../santri/santri.model';
import Pegawai from '../pegawai/pegawai.model';
import AppResource from '../resource/resource.model';
import JamPelajaran from '../jam.pelajaran/jam.pelajaran.model';
import Cabang from '../cabang/cabang.model';
import PenempatanKelasSantri from '../penempatan.kelas.santri/penempatan.kelas.santri.model';
import KelasFormal from '../kelas.formal/kelas.formal.model';
import KelasMda from '../kelas.mda/kelas.mda.model';
import Lokasi from '../location/location.model';
import { getUserContextData } from '../../../context/userContext';

export default class Repository {
  public async findMatchingJamPelajaran(waktu_absen: string) {
    const time = moment(waktu_absen, ['HH:mm:ss', 'HH:mm']).format('HH:mm:ss');
    const userContext = getUserContextData();

    const whereClause: any = {
      status: 'A',
      mulai: {
        [Op.lte]: time,
      },
      selesai: {
        [Op.gte]: time,
      },
    };

    if (userContext && userContext?.lembaga_type) {
      whereClause.lembaga_type = userContext?.lembaga_type;
    }

    if (userContext && userContext?.id_lembaga) {
      whereClause.id_lembaga = userContext.id_lembaga;
    }

    const result = await JamPelajaran.findAll({
      where: whereClause,
    });

    return result;
  }

  public async findAllJamPelajaran() {
    const result = await JamPelajaran.findAll({
      where: {
        status: 'A',
      },
    });

    return result;
  }

  public async checkExistingAbsen(criteria: {
    id_santri: string;
    tanggal: string;
    id_jam_pelajaran: string | null;
  }) {
    return await Model.findOne({
      where: {
        id_santri: criteria.id_santri,
        tanggal: criteria.tanggal,
        id_jam_pelajaran: criteria.id_jam_pelajaran,
      },
    });
  }

  public async detail(condition: { id_absen?: string }) {
    return await Model.findOne({
      where: condition,
      include: [
        {
          model: AppSantri,
          as: 'santri',
          attributes: ['id_santri', 'fullname', 'nis', 'nik', 'gender'],
        },
        {
          model: KelasFormal,
          as: 'kelasFormal',
          attributes: ['id_kelas', 'nama_kelas'],
        },
        {
          model: KelasMda,
          as: 'kelasMda',
          attributes: ['id_kelas_mda', 'nama_kelas_mda'],
        },
        {
          model: JamPelajaran,
          as: 'jamPelajaran',
          attributes: ['id_jampel', 'nama_jampel', 'mulai', 'selesai'],
        },
        {
          model: Pegawai,
          as: 'petugas',
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: AppResource,
          as: 'resource',
          attributes: ['resource_id', 'full_name'],
        },
      ],
    });
  }

  public async update(data: {
    payload: any;
    condition: { id_absen?: string };
  }) {
    return await Model.update(data.payload, {
      where: data.condition,
    });
  }

  public async upsertBulkAbsen(payloads: any[]) {
    const trx = await Model.sequelize?.transaction();
    try {
      for (const item of payloads) {
        const existing = await Model.findOne({
          where: {
            id_santri: item.id_santri,
            tanggal: item.tanggal,
            id_jam_pelajaran: item.id_jam_pelajaran,
            is_deleted: false,
          },
          transaction: trx,
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

  public async index(data: any) {
    const userContext = getUserContextData();
    const santriAttributes = ['id_santri', 'fullname', 'nis', 'nik', 'gender'];
    if (data?.isOpenApi) {
      santriAttributes.push(
        'id_santri_sitrendi',
        'id_wali_sitrendi',
        'institution_id_sitrendi'
      );
    }

    const query: any = {
      order: [
        ['tanggal', 'DESC'],
        ['waktu_absen', 'DESC'],
      ],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      include: [
        {
          model: AppSantri,
          as: 'santri',
          attributes: santriAttributes,
        },
        { model: KelasFormal, as: 'kelasFormal', attributes: ['nama_kelas'] },
        { model: KelasMda, as: 'kelasMda', attributes: ['nama_kelas_mda'] },
        {
          model: JamPelajaran,
          as: 'jamPelajaran',
          attributes: ['nama_jampel'],
        },
        { model: Pegawai, as: 'petugas', attributes: ['nama_lengkap'] },
        {
          model: AppResource,
          as: 'resource',
          attributes: ['resource_id', 'full_name'],
        },
      ],
      where: {
        is_deleted: false,
      },
    };

    if (userContext && userContext?.id_cabang) {
      query.include.push({
        model: Lokasi,
        as: 'lokasi',
        required: true,
        attributes: [],
        where: {
          id_cabang: userContext.id_cabang,
        },
      });
    }

    // 1. Filter Tanggal (jika data.tanggal dikirim)
    if (data?.tanggal) {
      query.where.tanggal = data.tanggal;
    }

    // 2. Filter Jam Pelajaran (id_jam_pelajaran)
    if (data?.id_jam_pelajaran) {
      query.where.id_jam_pelajaran = data.id_jam_pelajaran;
    }

    // 3. Filter Lokasi (id_lokasi)
    if (data?.id_lokasi) {
      query.where.id_lokasi = data.id_lokasi;
    }

    // 4. Filter Status Kehadiran (Hadir, Izin, Sakit, Alfa)
    if (data?.status) {
      query.where.status_kehadiran = data.status;
    }

    // 5. Filter Date Range (tanggal_awal & tanggal_akhir)
    if (data?.tanggal_awal && data?.tanggal_akhir) {
      query.where.tanggal = {
        [Op.between]: [data.tanggal_awal, data.tanggal_akhir],
      };
    }

    // 6. Filter Santri (id_santri SiTrendi dari relasi santri)
    if (data?.id_santri) {
      query.where['$santri.id_santri_sitrendi$'] = data.id_santri;
    }

    // 6. Filter Pencarian Global (Nama / NIS / Keyword)
    if (data?.keyword) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query.where[Op.or] = [
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
          Sequelize.fn('LOWER', Sequelize.col('kelasFormal.nama_kelas')),
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
          Sequelize.fn('LOWER', Sequelize.col('jamPelajaran.nama_jampel')),
          {
            [Op.like]: keyword,
          }
        ),
      ];
    }

    return await Model.findAndCountAll(query);
  }

  public async findSantriByNis(nis: string) {
    return await AppSantri.findOne({
      where: {
        status: 1, // Santri aktif
        [Op.or]: [{ nis: nis }, { kartu_santri_nomor: nis }],
      },
      attributes: ['id_santri', 'fullname', 'nis'],
    });
  }

  public async upsertSingleAbsen(payload: any) {
    const existing = await Model.findOne({
      where: {
        id_santri: payload.id_santri,
        tanggal: payload.tanggal,
        id_jam_pelajaran: payload.id_jam_pelajaran,
        is_deleted: false,
      },
    });

    if (existing) {
      return await existing.update({
        status_kehadiran: 'Hadir',
        waktu_absen: payload.waktu_absen,
        id_petugas: payload.id_petugas,
        id_jurnal: payload.id_jurnal,
        keterangan: 'Hadir via Pindai QR Code',
      });
    }

    return await Model.create(payload);
  }

  public async listForExport(params: {
    q?: string;
    id_lokasi?: string;
    id_jam_pelajaran?: string;
    tanggal?: string;
    status?: string;
    isTemplate?: boolean;
    limit?: number;
    tanggal_awal?: string;
    tanggal_akhir?: string;
  }) {
    const {
      q,
      id_lokasi,
      id_jam_pelajaran,
      tanggal,
      status,
      isTemplate,
      limit,
      tanggal_awal,
      tanggal_akhir,
    } = params;

    const userContext = getUserContextData();
    let whereClause: any = {
      is_deleted: false,
    };

    if (!isTemplate) {
      // 1. Filter Tanggal
      if (tanggal) {
        whereClause.tanggal = tanggal;
      }

      // 2. Filter Jam Pelajaran
      if (id_jam_pelajaran) {
        whereClause.id_jam_pelajaran = id_jam_pelajaran;
      }

      // 3. Filter Lokasi
      if (id_lokasi) {
        whereClause.id_lokasi = id_lokasi;
      }

      // 4. Filter Status Kehadiran
      if (status) {
        whereClause.status_kehadiran = status;
      }

      // 5. Filter Date Range (tanggal_awal & tanggal_akhir)
      if (tanggal_awal && tanggal_akhir) {
        whereClause.tanggal = {
          [Op.between]: [tanggal_awal, tanggal_akhir],
        };
      }

      // 6. Filter Pencarian Global (Nama / NIS)
      if (q) {
        const keyword = `%${q.toLowerCase()}%`;
        whereClause[Op.or] = [
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
        ];
      }
    }

    const includes: any[] = [
      { model: AppSantri, as: 'santri', attributes: ['fullname', 'nis'] },
      {
        model: KelasFormal,
        as: 'kelasFormal',
        attributes: ['id_kelas', 'nama_kelas'],
      },
      {
        model: KelasMda,
        as: 'kelasMda',
        attributes: ['id_kelas_mda', 'nama_kelas_mda'],
      },
      {
        model: JamPelajaran,
        as: 'jamPelajaran',
        attributes: ['id_jampel', 'nama_jampel'],
      },
      {
        model: Pegawai,
        as: 'petugas',
        attributes: ['id_pegawai', 'nama_lengkap'],
      },
      {
        model: AppResource,
        as: 'resource',
        attributes: ['resource_id', 'full_name'],
      },
    ];

    if (userContext && userContext?.id_cabang) {
      includes.push({
        model: Lokasi,
        as: 'lokasi',
        required: true,
        attributes: [],
        where: {
          id_cabang: userContext.id_cabang,
        },
      });
    }

    return await Model.findAll({
      where: whereClause,
      limit: limit || (isTemplate ? 5 : undefined),
      subQuery: false,
      include: includes,
      order: [
        ['tanggal', 'DESC'],
        [{ model: AppSantri, as: 'santri' }, 'fullname', 'ASC'],
      ],
    });
  }

  public async listSantriActiveForTemplate(params: { id_cabang?: string }) {
    let condition: any = {
      status: 1,
      id_cabang: params.id_cabang,
    };

    return await AppSantri.findAll({
      where: condition,
      attributes: ['id_santri', 'fullname', 'nis', 'nik'],
      include: [
        {
          model: Cabang,
          as: 'cabang',
          attributes: ['id_cabang', 'nama_cabang'],
        },
      ],
    });
  }

  public async findSantriByNisOnly(nis: string) {
    return await AppSantri.findOne({
      where: { nis: nis, status: 1 },
      attributes: ['id_santri', 'fullname', 'nis'],
    });
  }

  public async findKelasSantri(id_kelas: string) {
    let where: any = {
      status: 1,
    };

    if (id_kelas) {
      const targetDate = moment().format('YYYY-MM-DD');
      const placements = await PenempatanKelasSantri.findAll({
        where: {
          status: 'Aktif',
          [Op.and]: [
            {
              [Op.or]: [
                { tanggal_masuk: null },
                { tanggal_masuk: { [Op.lte]: targetDate } },
              ],
            },
            {
              [Op.or]: [
                { tanggal_keluar: null },
                { tanggal_keluar: { [Op.gte]: targetDate } },
              ],
            },
            {
              [Op.or]: [
                { id_kelas_formal: id_kelas },
                { id_kelas_mda: id_kelas },
              ],
            },
          ],
        },
        attributes: ['id_santri'],
      });

      const studentIds = placements.map((p) => p.getDataValue('id_santri'));
      where.id_santri = { [Op.in]: studentIds };
    }

    return await AppSantri.findAll({
      where: where,
      attributes: ['id_santri', 'fullname', 'nis'],
      include: [
        {
          model: Cabang,
          as: 'cabang',
          attributes: ['id_cabang', 'nama_cabang'],
        },
      ],
    });
  }

  public async checkSantriKelasValidity(
    id_santri: string,
    id_kelas: string,
    tanggal: string
  ) {
    const targetDate = moment(tanggal).format('YYYY-MM-DD');

    const placement = await PenempatanKelasSantri.findOne({
      where: {
        id_santri,
        status: 'Aktif',
        [Op.and]: [
          {
            [Op.or]: [
              { tanggal_masuk: null },
              { tanggal_masuk: { [Op.lte]: targetDate } },
            ],
          },
          {
            [Op.or]: [
              { tanggal_keluar: null },
              { tanggal_keluar: { [Op.gte]: targetDate } },
            ],
          },
          {
            [Op.or]: [
              { id_kelas_formal: id_kelas },
              { id_kelas_mda: id_kelas },
            ],
          },
        ],
      },
    });

    return !!placement;
  }

  public async findAllClasses() {
    const userContext = getUserContextData();
    let where: any = {
      status: 'Aktif'
    };

    if (userContext && userContext?.id_lembaga) {
      where.id_lembaga = userContext.id_lembaga;
    }

    const formal = await KelasFormal.findAll({
      where: where,
      attributes: ['id_kelas', 'nama_kelas'],
    });

    const mda = await KelasMda.findAll({
      where: where,
      attributes: ['id_kelas_mda', 'nama_kelas_mda'],
    });

    const list: any[] = [];
    formal.forEach((c) => {
      list.push({
        id_kelas: c.getDataValue('id_kelas'),
        nama_kelas: c.getDataValue('nama_kelas'),
        type: 'Formal',
      });
    });

    mda.forEach((c) => {
      list.push({
        id_kelas: c.getDataValue('id_kelas_mda'),
        nama_kelas: c.getDataValue('nama_kelas_mda'),
        type: 'MDA',
      });
    });

    return list.sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas));
  }
}

export const repository = new Repository();
