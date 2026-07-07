'use strict';

import { Op, Sequelize } from 'sequelize';
import PerizinanSantri from './perizinan.santri.model';
import SuratPerizinanSantri from '../surat.perizinan.santri/surat.perizinan.santri.model';
import LogGateSantri from '../log.gate.santri/log.gate.santri.model';
import AppResource from '../resource/resource.model';
import Santri from '../santri/santri.model';
import Lokasi from '../location/location.model';
import moment from 'moment';
import Pegawai from '../pegawai/pegawai.model';
import PenempatanKamarSantri from '../penempatan.kamar.santri/penempatan.kamar.santri.model';
import { getUserContextData } from '../../../context/userContext';

export class PerizinanSantriRepository {
  /**
   * Mengambil data paginasi + filter untuk list/index utama
   */
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

    const baseInclude: any[] = [
      {
        model: AppResource,
        as: 'approver',
        attributes: ['resource_id', 'username'],
      },
      {
        model: AppResource,
        as: 'creator',
        attributes: ['resource_id', 'full_name'],
      },
    ];

    if (data?.is_pegawai) {
      baseInclude.push(
        {
          model: Pegawai,
          as: 'pegawai',
          attributes: [
            'id_pegawai',
            'nama_lengkap',
            'nip',
            'nik',
            'jenis_kelamin',
          ],
        },
        {
          model: Lokasi,
          as: 'lokasiKerja',
          attributes: ['id_lokasi', 'nama_lokasi', 'kode_lokasi'],
        }
      );
    } else {
      baseInclude.push(
        {
          model: Santri,
          as: 'santri',
          attributes: santriAttributes,
        },
        {
          model: Lokasi,
          as: 'lokasiKamar',
          attributes: ['id_lokasi', 'nama_lokasi', 'kode_lokasi'],
        }
      );
    }

    const query: any = {
      order: [['created_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      subQuery: false,
      include: baseInclude,
      where: {},
    };

    if (userContext && userContext?.id_cabang) {
      if (data?.is_pegawai) {
        query.where = {
          ...query.where,
          '$lokasiKerja.id_cabang$': userContext.id_cabang,
        };
      } else {
        query.where = {
          ...query.where,
          '$lokasiKamar.id_cabang$': userContext.id_cabang,
        };
      }
    }

    // Filter Status Approval
    if (data?.status_approval) {
      query.where.status_approval = data.status_approval;

      switch (data.status_approval) {
        case 'Menunggu':
          query.where.is_canceled = false;
          break;

        case 'Disetujui':
          query.where.is_request_canceled = false;
          query.where.is_canceled = false;
          break;

        case 'Dibatalkan':
          query.where.is_canceled = true;
          break;

        default:
          break;
      }
    }

    // Filter Jenis Izin
    if (data?.jenis_izin) {
      query.where.jenis_izin = data.jenis_izin;
    }

    if (data?.is_pegawai) {
      if (data?.id_pegawai) {
        query.where.id_pegawai = data.id_pegawai;
      }
      query.where.id_pegawai = { [Op.ne]: null };
    } else {
      query.where.sumber_pengajuan = { [Op.ne]: 'Pegawai' };
      query.where.id_santri = { [Op.ne]: null };
    }

    if (data?.id_santri) {
      query.where['$santri.id_santri_sitrendi$'] = data.id_santri;
    }

    // Filter Date Range Picker (Berdasarkan tanggal_mulai dan tanggal_selesai)
    if (data?.start_date && data?.end_date) {
      query.where[Op.and] = [
        { tanggal_mulai: { [Op.lte]: data.end_date } },    
        { tanggal_selesai: { [Op.gte]: data.start_date } },
      ];
    }

    if (data?.is_request_canceled !== undefined) {
      query.where.is_request_canceled = data.is_request_canceled;
    }

    if (data?.is_canceled !== undefined) {
      query.where.is_canceled = data.is_canceled;
    }

    if (data?.kondisi) {
      query.where.kondisi = data.kondisi;
    }

    if (data?.keyword) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      if (data?.is_pegawai) {
        query.where[Op.or] = [
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('pegawai.nama_lengkap')),
            {
              [Op.like]: keyword,
            }
          ),
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(Sequelize.col('pegawai.nip'), 'TEXT')
            ),
            {
              [Op.like]: keyword,
            }
          ),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('lokasiKerja.nama_lokasi')),
            {
              [Op.like]: keyword,
            }
          ),
        ];
      } else {
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
            Sequelize.fn('LOWER', Sequelize.col('lokasiKamar.nama_lokasi')),
            {
              [Op.like]: keyword,
            }
          ),
        ];
      }
    }

    return await PerizinanSantri.findAndCountAll(query);
  }

  /**
   * Menemukan perizinan santri aktif berdasarkan nomor kartu santri
   * Aturan: Status wajib 'Disetujui', belum dibatalkan, dan hari ini berada di dalam rentang izin.
   */
  public async findActiveIzinByCardNumber(nomorKartu: string) {
    const today = moment().format('YYYY-MM-DD');

    return await PerizinanSantri.findOne({
      where: {
        status_approval: 'Disetujui',
        is_canceled: false,
        deleted_at: null,
        tanggal_mulai: { [Op.lte]: today },
        tanggal_selesai: { [Op.gte]: today },
      },
      include: [
        {
          model: Santri,
          as: 'santri',
          where: { kartu_santri_nomor: nomorKartu }, // Sesuai nama kolom nomor kartu di database Anda
          attributes: ['fullname', 'nis'],
        },
        {
          model: Lokasi,
          as: 'lokasiKamar',
          attributes: ['nama_lokasi'],
        },
      ],
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * Cek aturan overlap izin santri aktif
   */
  public async checkActiveLicense(
    id_santri: string, 
    startDateInput: string, 
    endDateInput: string,  
    transaction?: any
  ) {
    const start = moment(startDateInput).format('YYYY-MM-DD');
    const end = moment(endDateInput).format('YYYY-MM-DD');

    return await PerizinanSantri.findOne({
      where: {
        id_santri,
        deleted_at: null,
        status_approval: { [Op.in]: ['Menunggu', 'Disetujui'] },
        is_canceled: false,
        
        [Op.and]: [
          { tanggal_mulai: { [Op.lte]: end } },   
          { tanggal_selesai: { [Op.gte]: start } } 
        ]
      },
      order: [['created_at', 'DESC']],
      transaction,
    });
  }

  /**
   * Cek aturan overlap izin pegawai aktif
   */
  public async checkActiveLicensePegawai(
    id_pegawai: string,
    transaction?: any
  ) {
    const today = moment().format('YYYY-MM-DD');

    return await PerizinanSantri.findOne({
      where: {
        id_pegawai,
        deleted_at: null,
        [Op.or]: [
          {
            status_approval: 'Menunggu',
            tanggal_mulai: { [Op.gt]: today },
          },
          {
            status_approval: 'Disetujui',
            is_canceled: false,
            tanggal_mulai: { [Op.lte]: today },
            tanggal_selesai: { [Op.gte]: today },
          },
        ],
      },
      order: [['created_at', 'DESC']],
      transaction,
    });
  }

  /**
   * Detail Data Perizinan Lengkap dengan Relasinya
   */
  public async detail(condition: any) {
    return await PerizinanSantri.findOne({
      include: [
        { model: Santri, as: 'santri' },
        { model: Pegawai, as: 'pegawai' },
        { model: Lokasi, as: 'lokasiKamar' },
        { model: Lokasi, as: 'lokasiKerja' },
        {
          model: AppResource,
          as: 'approver',
          attributes: ['resource_id', 'username'],
        },
        {
          model: AppResource,
          as: 'canceler',
          attributes: ['resource_id', 'username'],
        },
        {
          model: AppResource,
          as: 'creator',
          attributes: ['resource_id', 'username'],
        },
        { model: SuratPerizinanSantri, as: 'suratPerizinan' },
      ],
      where: condition,
    });
  }

  public async create(payload: any, transaction?: any) {
    return await PerizinanSantri.create(payload, { transaction });
  }

  public async update(payload: any, condition: any, transaction?: any) {
    return await PerizinanSantri.update(payload, {
      where: condition,
      transaction,
    });
  }

  public async findSantriByCabangMassal(id_cabang: string, transaction?: any) {
    return await Santri.findAll({
      where: {
        id_cabang: id_cabang,
        status: 1, 
      },
      include: [
        {
          model: PenempatanKamarSantri,
          as: 'penempatanKamar',
          where: { status: 'Aktif' },
          required: false, 
        },
      ],
      transaction,
    });
  }

  // --- OPRASIONAL TABEL SURAT ---
  public async getNextUrutSurat(tahun: number): Promise<number> {
    const max = await SuratPerizinanSantri.max('urut', { where: { tahun } });
    return max ? (max as number) + 1 : 1;
  }

  public async createSurat(payload: any, transaction?: any) {
    return await SuratPerizinanSantri.create(payload, { transaction });
  }

  public async updateSurat(payload: any, condition: any, transaction?: any) {
    return await SuratPerizinanSantri.update(payload, {
      where: condition,
      transaction,
    });
  }

  public async findSuratByToken(token: string) {
    return await SuratPerizinanSantri.findOne({
      where: { qrcode_token: token, status_surat: 'Aktif' },
      include: [
        {
          model: PerizinanSantri,
          as: 'perizinanSantri',
          include: [
            // Load data profile santri untuk mengambil fullname & nis
            {
              model: Santri,
              as: 'santri',
              attributes: ['fullname', 'nis'],
            },
            // Load data lokasi untuk mengambil nama_lokasi kamar
            {
              model: Lokasi,
              as: 'lokasiKamar',
              attributes: ['nama_lokasi'],
            },
          ],
        },
      ],
    });
  }

  // --- OPRASIONAL TABEL LOG GATE ---
  public async findLogGate(id_izin: string) {
    return await LogGateSantri.findOne({ where: { id_izin } });
  }

  public async createLogGate(payload: any, transaction?: any) {
    return await LogGateSantri.create(payload, { transaction });
  }

  public async updateLogGate(payload: any, condition: any, transaction?: any) {
    return await LogGateSantri.update(payload, {
      where: condition,
      transaction,
    });
  }

  // --- HANDLING EXPORT / IMPORT TEMPLATE ---
  /**
   * Mengambil data untuk kebutuhan export excel / template excel
   * Mengadopsi filter penuh dari fungsi index sesuai standar modul Pegawai
   */
  public async listForExport(params: {
    keyword?: string;
    status_approval?: string;
    jenis_izin?: string;
    start_date?: string;
    end_date?: string;
    isTemplate?: boolean;
    limit?: number;
    is_pegawai?: boolean;
    id_pegawai?: string;
  }) {
    const {
      keyword,
      status_approval,
      jenis_izin,
      start_date,
      end_date,
      isTemplate,
      limit,
      is_pegawai,
      id_pegawai,
    } = params;
    const q = keyword ? `%${keyword}%` : null;

    const userContext = getUserContextData();
    let whereClause: any = {};

    if (userContext && userContext?.id_cabang) {
      if (is_pegawai) {
        whereClause = {
          ...whereClause,
          '$lokasiKerja.id_cabang$': userContext.id_cabang,
        };
      } else {
        whereClause = {
          ...whereClause,
          '$lokasiKamar.id_cabang$': userContext.id_cabang,
        };
      }
    }

    if (is_pegawai) {
      whereClause.sumber_pengajuan = 'Pegawai';
      if (id_pegawai) {
        whereClause.id_pegawai = id_pegawai;
      }
    } else {
      whereClause.sumber_pengajuan = { [Op.ne]: 'Pegawai' };
    }

    if (!isTemplate) {
      if (status_approval) {
        whereClause.status_approval = status_approval;

        switch (status_approval) {
          case 'Menunggu':
            whereClause.is_canceled = false;
            break;
          case 'Disetujui':
            whereClause.is_request_canceled = false;
            whereClause.is_canceled = false;
            break;
          case 'Ditolak':
            whereClause.is_canceled = true;
            break;
          default:
            break;
        }
      }

      if (jenis_izin) {
        whereClause.jenis_izin = jenis_izin;
      }

      if (start_date && end_date) {
        whereClause[Op.and] = [
          { tanggal_mulai: { [Op.lte]: end_date } },     // Mulai sebelum/saat filter berakhir
          { tanggal_selesai: { [Op.gte]: start_date } },
        ];
      }

      if (q) {
        const keywordLower = q.toLowerCase();
        if (is_pegawai) {
          whereClause[Op.or] = [
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('pegawai.nama_lengkap')),
              {
                [Op.like]: keywordLower,
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(Sequelize.col('pegawai.nip'), 'TEXT')
              ),
              {
                [Op.like]: keywordLower,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('lokasiKerja.nama_lokasi')),
              {
                [Op.like]: keywordLower,
              }
            ),
          ];
        } else {
          whereClause[Op.or] = [
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('santri.fullname')),
              {
                [Op.like]: keywordLower,
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(Sequelize.col('santri.nis'), 'TEXT')
              ),
              {
                [Op.like]: keywordLower,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('lokasiKamar.nama_lokasi')),
              {
                [Op.like]: keywordLower,
              }
            ),
          ];
        }
      }
    }

    const includeClause: any[] = [];
    if (is_pegawai) {
      includeClause.push(
        {
          model: Pegawai,
          as: 'pegawai',
          attributes: ['id_pegawai', 'nip', 'nama_lengkap'],
        },
        {
          model: Lokasi,
          as: 'lokasiKerja',
          attributes: ['id_lokasi', 'nama_lokasi', 'kode_lokasi'],
        }
      );
    } else {
      includeClause.push(
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'nis', 'fullname'],
        },
        {
          model: Lokasi,
          as: 'lokasiKamar',
          attributes: ['id_lokasi', 'nama_lokasi', 'kode_lokasi'],
        }
      );
    }

    return await PerizinanSantri.findAll({
      where: whereClause,
      limit: limit || (isTemplate ? 5 : undefined),
      subQuery: false,
      include: includeClause,
      order: [['created_at', 'DESC']],
    });
  }

  public async insertImport(payloads: any[]) {
    const trx = await PerizinanSantri.sequelize?.transaction();
    try {
      for (const item of payloads) {
        await PerizinanSantri.create(item, { transaction: trx });
      }
      await trx?.commit();
      return true;
    } catch (error) {
      await trx?.rollback();
      throw error;
    }
  }

  public async createPerizinanMassal(payloads: any[], transaction?: any) {
    return await PerizinanSantri.bulkCreate(payloads, { transaction });
  }

  public async createSuratMassal(payloads: any[], transaction?: any) {
    return await SuratPerizinanSantri.bulkCreate(payloads, { transaction });
  }

  public async createLogMassal(payloads: any[], transaction?: any) {
    return await LogGateSantri.bulkCreate(payloads, { transaction });
  }
}

export const repository = new PerizinanSantriRepository();
