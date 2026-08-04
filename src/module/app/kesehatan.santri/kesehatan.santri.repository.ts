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
import Cabang from '../cabang/cabang.model';
import OrganizationUnit from '../organization.unit/organization.unit.model';
import { getUserContextData } from '../../../context/userContext';
import { TIMEZONE } from '../../../utils/constant';

export class KesehatanSantriRepository {
  public async index(data: any) {
    const limit = data?.limit ? parseInt(data.limit) : 10;
    const offset = data?.offset ? parseInt(data.offset) : 0;
    const userContext = getUserContextData();
    const idCabang = userContext?.id_cabang;

    const includeClause: any[] = [
      {
        model: Santri,
        as: 'santri',
        attributes: ['id_santri', 'fullname', 'nis', 'gender'],
        include: [
          {
            model: Cabang,
            as: 'cabang',
            attributes: ['id_cabang', 'nama_cabang'],
            required: false,
          },
        ],
      },
      {
        model: Pegawai,
        as: 'pegawai',
        attributes: ['id_pegawai', 'nama_lengkap', 'nip', 'jenis_kelamin'],
        include: [
          {
            model: OrganizationUnit,
            as: 'organizationUnit',
            attributes: ['id_orgunit', 'nama_orgunit'],
            required: false,
          },
        ],
      },
      {
        model: AppResource,
        as: 'petugas',
        attributes: ['resource_id', 'full_name', 'id_eksternal'],
      },
      {
        model: PerizinanSantri,
        as: 'perizinan',
        attributes: [
          'id_izin',
          'status_approval',
          'is_canceled',
          'tanggal_mulai',
          'tanggal_selesai',
        ],
      },
    ];

    const andConditions: any[] = [{ is_deleted: false }];

    if (data?.progres_status) {
      andConditions.push({ progres_status: data.progres_status });
    }

    if (data?.kategori_sakit) {
      andConditions.push({ kategori_sakit: data.kategori_sakit });
    }

    if (data?.id_santri) {
      andConditions.push({ id_santri: data.id_santri });
    }

    if (data?.id_pegawai) {
      andConditions.push({ id_pegawai: data.id_pegawai });
    }

    if (data?.subject_type === 'santri') {
      andConditions.push({ id_santri: { [Op.ne]: null } });
    } else if (data?.subject_type === 'pegawai') {
      andConditions.push({ id_pegawai: { [Op.ne]: null } });
    }

    if (data?.tanggal_awal && data?.tanggal_akhir) {
      andConditions.push({
        tanggal_event: {
          [Op.between]: [
            moment(data.tanggal_awal).startOf('day').toDate(),
            moment(data.tanggal_akhir).endOf('day').toDate(),
          ],
        },
      });
    }

    const idCabangFilter = data?.id_cabang || idCabang;
    if (idCabangFilter) {
      andConditions.push({
        [Op.or]: [
          { '$santri.id_cabang$': idCabangFilter },
          { '$pegawai.organizationUnit.id_cabang$': idCabangFilter },
        ],
      });
    }

    if (data?.id_orgunit) {
      andConditions.push({
        '$pegawai.id_orgunit$': data.id_orgunit,
      });
    }

    if (data?.keyword) {
      const keywordLower = `%${data.keyword.toLowerCase()}%`;
      andConditions.push({
        [Op.or]: [
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
            Sequelize.fn('LOWER', Sequelize.col('petugas.full_name')),
            {
              [Op.like]: keywordLower,
            }
          ),
        ],
      });
    }

    const whereClause = { [Op.and]: andConditions };

    const rows = await KesehatanSantri.findAll({
      where: whereClause,
      include: includeClause,
      limit,
      offset,
      order: [
        ['tanggal_event', 'DESC'],
        ['created_at', 'DESC'],
      ],
      subQuery: false,
    });

    const countInclude = includeClause.filter(
      (inc) => inc.model === Santri || inc.model === Pegawai
    );

    const count = await KesehatanSantri.count({
      where: whereClause,
      include: countInclude,
      distinct: true,
      col: 'id_kesehatan',
    });

    const ringan = await KesehatanSantri.count({
      where: { [Op.and]: [...andConditions, { kategori_sakit: 'Ringan' }] },
      include: countInclude,
      distinct: true,
      col: 'id_kesehatan',
    });
    const sedang = await KesehatanSantri.count({
      where: { [Op.and]: [...andConditions, { kategori_sakit: 'Sedang' }] },
      include: countInclude,
      distinct: true,
      col: 'id_kesehatan',
    });
    const berat = await KesehatanSantri.count({
      where: { [Op.and]: [...andConditions, { kategori_sakit: 'Berat' }] },
      include: countInclude,
      distinct: true,
      col: 'id_kesehatan',
    });
    const dirawat = await KesehatanSantri.count({
      where: { [Op.and]: [...andConditions, { progres_status: 'Dirawat' }] },
      include: countInclude,
      distinct: true,
      col: 'id_kesehatan',
    });
    const dirujuk = await KesehatanSantri.count({
      where: { [Op.and]: [...andConditions, { progres_status: 'Dirujuk' }] },
      include: countInclude,
      distinct: true,
      col: 'id_kesehatan',
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
      },
    };
  }

  public async detail(condition: any) {
    const userContext = getUserContextData();
    const idCabang = userContext?.id_cabang;

    const whereClause: any = {
      ...condition,
      is_deleted: false,
    };

    if (idCabang) {
      whereClause[Op.or] = [
        { '$santri.id_cabang$': idCabang },
        { '$pegawai.organizationUnit.id_cabang$': idCabang },
      ];
    }

    return await KesehatanSantri.findOne({
      where: whereClause,
      include: [
        {
          model: Santri,
          as: 'santri',
          attributes: ['id_santri', 'fullname', 'nis', 'gender'],
          include: [
            {
              model: Cabang,
              as: 'cabang',
              attributes: ['id_cabang', 'nama_cabang'],
              required: false,
            },
          ],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          attributes: ['id_pegawai', 'nama_lengkap', 'nip', 'jenis_kelamin'],
          include: [
            {
              model: OrganizationUnit,
              as: 'organizationUnit',
              attributes: ['id_orgunit', 'nama_orgunit'],
              required: false,
            },
          ],
        },
        {
          model: AppResource,
          as: 'petugas',
          attributes: ['resource_id', 'full_name', 'id_eksternal'],
        },
        {
          model: PerizinanSantri,
          as: 'perizinan',
          attributes: [
            'id_izin',
            'status_approval',
            'is_canceled',
            'tanggal_mulai',
            'tanggal_selesai',
          ],
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

  public async checkActivePerizinan(
    id_santri: string | null,
    id_pegawai: string | null = null,
    transaction?: any
  ) {
    const today = moment().tz(TIMEZONE).format('YYYY-MM-DD');

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
              tanggal_mulai: { [Op.lte]: `${today} 23:59:59` },
              tanggal_selesai: { [Op.gte]: `${today} 00:00:00` },
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
            tanggal_mulai: { [Op.lte]: `${today} 23:59:59` },
            tanggal_selesai: { [Op.gte]: `${today} 00:00:00` },
          },
        ],
      },
      transaction,
    });
  }

  public async getActiveKamar(id_santri: string, tanggal?: string) {
    const targetDate = tanggal
      ? moment(tanggal).format('YYYY-MM-DD')
      : moment().tz(TIMEZONE).format('YYYY-MM-DD');

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

  public async getLatestMedicalEvent(
    id_santri: string | null,
    id_pegawai: string | null = null
  ) {
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

  public async isSantriDirawat(
    id_santri: string | null,
    id_pegawai: string | null = null
  ): Promise<boolean> {
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
