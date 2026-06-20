'use strict';

import { Op, Sequelize } from 'sequelize';
import PerizinanSantri from './perizinan.santri.model';
import SuratPerizinanSantri from '../surat.perizinan.santri/surat.perizinan.santri.model';
import LogGateSantri from '../log.gate.santri/log.gate.santri.model';
import AppResource from '../resource/resource.model';
import Santri from '../santri/santri.model';
import Lokasi from '../location/location.model';
import moment from 'moment';

export class PerizinanSantriRepository {
  /**
   * Mengambil data paginasi + filter untuk list/index utama
   */
  public async index(data: any) {
    const santriAttributes = ['id_santri', 'fullname', 'nis', 'nik', 'gender'];
    if (data?.isOpenApi) {
      santriAttributes.push(
        'id_santri_sitrendi',
        'id_wali_sitrendi',
        'institution_id_sitrendi'
      );
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
          model: Lokasi,
          as: 'lokasiKamar',
          attributes: ['id_lokasi', 'nama_lokasi', 'kode_lokasi'],
        },
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
      ],
      where: {},
    };

    // Filter Status Approval
    if (data?.status_approval) {
      query.where.status_approval = data.status_approval;
    }

    // Filter Jenis Izin
    if (data?.jenis_izin) {
      query.where.jenis_izin = data.jenis_izin;
    }

    // Filter Santri (id_santri SiTrendi)
    if (data?.id_santri) {
      query.where['$santri.id_santri_sitrendi$'] = data.id_santri;
    }

    // Filter Date Range Picker (Berdasarkan tanggal_mulai dan tanggal_selesai)
    if (data?.start_date && data?.end_date) {
      query.where[Op.and] = [
        { tanggal_mulai: { [Op.gte]: data.start_date } },
        { tanggal_selesai: { [Op.lte]: data.end_date } },
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

    // Filter Free Text (Nama Santri / NIS / Kamar)
    if (data?.keyword) {
      const keyword = `%${data.keyword}%`;
      query.where[Op.or] = [
        { '$santri.fullname$': { [Op.iLike]: keyword } },
        { '$santri.nis$': { [Op.iLike]: keyword } },
        { '$lokasiKamar.nama_lokasi$': { [Op.iLike]: keyword } },
      ];
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
    });
  }

  /**
   * Cek aturan overlap izin santri aktif
   */
  public async checkActiveLicense(id_santri: string, transaction?: any) {
    const today = moment().format('YYYY-MM-DD');

    return await PerizinanSantri.findOne({
      where: {
        id_santri,
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
        { model: Lokasi, as: 'lokasiKamar' },
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
  }) {
    const {
      keyword,
      status_approval,
      jenis_izin,
      start_date,
      end_date,
      isTemplate,
      limit,
    } = params;
    const q = keyword ? `%${keyword}%` : null;

    let whereClause: any = {};

    if (!isTemplate) {
      if (status_approval) {
        whereClause.status_approval = status_approval;
      }

      if (jenis_izin) {
        whereClause.jenis_izin = jenis_izin;
      }

      if (start_date && end_date) {
        whereClause[Op.and] = [
          { tanggal_mulai: { [Op.gte]: start_date } },
          { tanggal_selesai: { [Op.lte]: end_date } },
        ];
      }

      if (q) {
        whereClause[Op.or] = [
          { '$santri.fullname$': { [Op.iLike]: q } },
          { '$santri.nis$': { [Op.iLike]: q } },
          { '$lokasiKamar.nama_lokasi$': { [Op.iLike]: q } },
        ];
      }
    }

    return await PerizinanSantri.findAll({
      where: whereClause,
      limit: limit || (isTemplate ? 5 : undefined),
      subQuery: false,
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'nis', 'fullname'],
        },
        {
          model: Lokasi,
          as: 'lokasiKamar',
          attributes: ['id_lokasi', 'nama_lokasi', 'kode_lokasi'],
        },
      ],
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
}

export const repository = new PerizinanSantriRepository();
