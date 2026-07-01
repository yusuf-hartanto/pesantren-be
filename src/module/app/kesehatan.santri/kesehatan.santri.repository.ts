'use strict';

import { Op, Sequelize } from 'sequelize';
import moment from 'moment';
import KesehatanSantri from './kesehatan.santri.model';
import Santri from '../santri/santri.model';
import Pegawai from '../pegawai/pegawai.model';
import PerizinanSantri from '../perizinan.santri/perizinan.santri.model';
import SuratPerizinanSantri from '../surat.perizinan.santri/surat.perizinan.santri.model';
import PenempatanKamarSantri from '../penempatan.kamar.santri/penempatan.kamar.santri.model';
import Lokasi from '../location/location.model';
import AppResource from '../resource/resource.model';

export class KesehatanSantriRepository {
  public async index(data: any) {
    const limit = data?.limit ? parseInt(data.limit) : 10;
    const offset = data?.offset ? parseInt(data.offset) : 0;

    const includeClause: any[] = [
      {
        model: Santri,
        as: 'santri',
        attributes: ['id_santri', 'fullname', 'nis', 'gender'],
      },
      {
        model: Pegawai,
        as: 'pegawai',
        attributes: ['id_pegawai', 'nama_lengkap', 'nip', 'jenis_kelamin'],
      },
      {
        model: AppResource,
        as: 'petugas',
        attributes: ['resource_id', 'full_name', 'id_eksternal'],
      },
      {
        model: PerizinanSantri,
        as: 'perizinan',
        attributes: ['id_izin', 'status_approval', 'is_canceled', 'tanggal_mulai', 'tanggal_selesai'],
      },
    ];

    const whereClause: any = {
      is_deleted: false,
    };

    if (data?.progres_status) {
      whereClause.progres_status = data.progres_status;
    }

    if (data?.kategori_sakit) {
      whereClause.kategori_sakit = data.kategori_sakit;
    }

    if (data?.id_santri) {
      whereClause.id_santri = data.id_santri;
    }

    if (data?.id_pegawai) {
      whereClause.id_pegawai = data.id_pegawai;
    }

    if (data?.subject_type === 'santri') {
      whereClause.id_santri = { [Op.ne]: null };
    } else if (data?.subject_type === 'pegawai') {
      whereClause.id_pegawai = { [Op.ne]: null };
    }

    if (data?.tanggal_awal && data?.tanggal_akhir) {
      whereClause.tanggal_event = {
        [Op.between]: [
          moment(data.tanggal_awal).startOf('day').toDate(),
          moment(data.tanggal_akhir).endOf('day').toDate(),
        ],
      };
    }

    if (data?.keyword) {
      const keywordLower = `%${data.keyword.toLowerCase()}%`;
      whereClause[Op.or] = [
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('santri.fullname')),
          {
            [Op.like]: keywordLower,
          }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.cast(Sequelize.col('santri.nis'), 'TEXT')),
          {
            [Op.like]: keywordLower,
          }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('pegawai.nama_lengkap')),
          {
            [Op.like]: keywordLower,
          }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.cast(Sequelize.col('pegawai.nip'), 'TEXT')),
          {
            [Op.like]: keywordLower,
          }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('petugas.full_name')),
          {
            [Op.like]: keywordLower,
          }
        ),
      ];
    }

    const rows = await KesehatanSantri.findAll({
      where: whereClause,
      include: includeClause,
      limit,
      offset,
      order: [['tanggal_event', 'DESC'], ['created_at', 'DESC']],
    });

    const count = await KesehatanSantri.count({
      where: whereClause,
      include: includeClause.filter(inc => inc.model === Santri || inc.model === Pegawai),
    });

    const ringan = await KesehatanSantri.count({
      where: { ...whereClause, kategori_sakit: 'Ringan' },
      include: includeClause.filter(inc => inc.model === Santri || inc.model === Pegawai),
    });
    const sedang = await KesehatanSantri.count({
      where: { ...whereClause, kategori_sakit: 'Sedang' },
      include: includeClause.filter(inc => inc.model === Santri || inc.model === Pegawai),
    });
    const berat = await KesehatanSantri.count({
      where: { ...whereClause, kategori_sakit: 'Berat' },
      include: includeClause.filter(inc => inc.model === Santri || inc.model === Pegawai),
    });
    const dirawat = await KesehatanSantri.count({
      where: { ...whereClause, progres_status: 'Dirawat' },
      include: includeClause.filter(inc => inc.model === Santri || inc.model === Pegawai),
    });
    const dirujuk = await KesehatanSantri.count({
      where: { ...whereClause, progres_status: 'Dirujuk' },
      include: includeClause.filter(inc => inc.model === Santri || inc.model === Pegawai),
    });

    return {
      total: count,
      values: rows,
      summary: {
        ringan,
        sedang,
        berat,
        dirawat,
        dirujuk,
      }
    };
  }

  public async detail(condition: any) {
    return await KesehatanSantri.findOne({
      where: {
        ...condition,
        is_deleted: false,
      },
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'fullname', 'nis', 'gender'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          attributes: ['id_pegawai', 'nama_lengkap', 'nip', 'jenis_kelamin'],
        },
        {
          model: AppResource,
          as: 'petugas',
          attributes: ['resource_id', 'full_name', 'id_eksternal'],
        },
        {
          model: PerizinanSantri,
          as: 'perizinan',
          attributes: ['id_izin', 'status_approval', 'is_canceled', 'tanggal_mulai', 'tanggal_selesai'],
          include: [
            {
              model: SuratPerizinanSantri,
              as: 'suratPerizinan',
            },
          ],
        },
      ],
    });
  }

  public async create(payload: any, transaction?: any) {
    return await KesehatanSantri.create(payload, { transaction });
  }

  public async update(payload: any, condition: any, transaction?: any) {
    return await KesehatanSantri.update(payload, {
      where: condition,
      transaction,
    });
  }

  public async checkActivePerizinan(id_santri: string | null, id_pegawai: string | null = null, transaction?: any) {
    const today = moment().format('YYYY-MM-DD');

    if (id_pegawai) {
      return await PerizinanSantri.findOne({
        where: {
          id_pegawai,
          is_canceled: false,
          [Op.or]: [
            {
              status_approval: 'Menunggu',
              kondisi: null,
            },
            {
              status_approval: 'Disetujui',
              kondisi: 'Normal',
              tanggal_mulai: { [Op.lte]: today },
              tanggal_selesai: { [Op.gte]: today },
            },
          ],
        },
        transaction,
      });
    }

    return await PerizinanSantri.findOne({
      where: {
        id_santri,
        is_canceled: false,
        [Op.or]: [
          {
            status_approval: 'Menunggu',
            kondisi: null,
          },
          {
            status_approval: 'Disetujui',
            kondisi: 'Normal',
            tanggal_mulai: { [Op.lte]: today },
            tanggal_selesai: { [Op.gte]: today },
          },
        ],
      },
      transaction,
    });
  }

  public async getActiveKamar(id_santri: string, tanggal?: string) {
    const targetDate = tanggal ? moment(tanggal).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');

    const placement = await PenempatanKamarSantri.findOne({
      where: {
        id_santri,
        status: 'Aktif',
        is_deleted: false,
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
        ],
      },
    });

    return placement ? placement.id_lokasi : null;
  }

  public async getLocation(id_lokasi: string) {
    return await Lokasi.findOne({
      where: {
        id_lokasi,
      },
    });
  }

  public async getLatestMedicalEvent(id_santri: string | null, id_pegawai: string | null = null) {
    const whereClause: any = { is_deleted: false };
    if (id_santri) whereClause.id_santri = id_santri;
    if (id_pegawai) whereClause.id_pegawai = id_pegawai;

    return await KesehatanSantri.findOne({
      where: whereClause,
      order: [
        ['tanggal_event', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
  }

  public async isSantriDirawat(id_santri: string | null, id_pegawai: string | null = null): Promise<boolean> {
    const latestEvent = await this.getLatestMedicalEvent(id_santri, id_pegawai);
    return latestEvent ? latestEvent.progres_status == 'Dirawat' : false;
  }

  public async getNextUrutSurat(tahun: number): Promise<number> {
    const max = await SuratPerizinanSantri.max('urut', { where: { tahun } });
    return max ? (max as number) + 1 : 1;
  }
}

export const repository = new KesehatanSantriRepository();
export default repository;
