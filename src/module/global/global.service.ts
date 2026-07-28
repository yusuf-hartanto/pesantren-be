import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { helper } from '../../helpers/helper';
import { repository as repoSantri } from '../app/santri/santri.repository';
import { repository as repoWali } from '../app/orang.tua.wali/orang.tua.wali.repository';
import { repository as repoInstitution } from '../app/institution/institution.repository';
import AppSantri from '../app/santri/santri.model';
import AbsenHarianSantri from '../app/absen.harian.santri/absen.harian.santri.model';
import AbsenKelasSantri from '../app/absen.kelas.santri/absen.kelas.santri.model';
import KebersihanTemuan from '../app/kebersihan.temuan/kebersihan.temuan.model';
import KebersihanInspeksi from '../app/kebersihan.inspeksi/kebersihan.inspeksi.model';
import PerizinanSantri from '../app/perizinan.santri/perizinan.santri.model';
import Pegawai from '../app/pegawai/pegawai.model';
import AbsenHarianPegawai from '../app/pegawai.absen.harian/pegawai.absen.harian.model';
import JurnalKelas from '../app/jurnal.kelas/jurnal.kelas.model';
import { Op, Sequelize, QueryTypes } from 'sequelize';
import moment from 'moment';
import { rawQuery } from '../../helpers/rawQuery';
import { getUserContextData } from '../../context/userContext';
import Lokasi from '../app/location/location.model';
import OrganizationUnit from '../app/organization.unit/organization.unit.model';
import KelasFormal from '../app/kelas.formal/kelas.formal.model';
import KelasMda from '../app/kelas.mda/kelas.mda.model';
import LembagaPendidikanFormal from '../app/lembaga.pendidikan.formal/lembaga.pendidikan.formal.model';
import PenempatanKelasSantri from '../app/penempatan.kelas.santri/penempatan.kelas.santri.model';
import PenempatanKamarSantri from '../app/penempatan.kamar.santri/penempatan.kamar.santri.model';
import LembagaPendidikanKepesantrenan from '../app/lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.model';
import Cabang from '../app/cabang/cabang.model';
import { TIMEZONE } from '../../utils/constant';

const BASE_URL = process.env.SITRENDI_URL || '';
const SECRET_KEY = process.env.SITRENDI_SECRET_KEY || '';

const ONESIGNAL_URL = process.env.ONESIGNAL_URL || '';
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const ONESIGNAL_APP_KEY = process.env.ONESIGNAL_APP_KEY || '';

interface SyncSantriPayload {
  institution_id: string;
  kelas: string;
  user_id: string;
}

interface NotificationPayload {
  title: string;
  message: string;
  url: string;
  receiver: string[];
}

export default class Service {
  public async syncSantri(data: SyncSantriPayload) {
    if (!BASE_URL) return 'Belum setup url SiTrendi';
    if (!SECRET_KEY) return 'Belum setup secret_key SiTrendi';

    let payload: any = {
      institution_id: data.institution_id,
    };
    if (data.kelas) payload['kelas'] = data.kelas;
    if (data.user_id) payload['user_id'] = data.user_id;

    const timestamp = helper.generateTimestamp();
    const rawBody = JSON.stringify(payload);

    const signature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(timestamp + rawBody)
      .digest('hex');

    const response = await fetch(`${BASE_URL}/api/open/sync-santri`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': timestamp,
        'X-Signature': signature,
      },
      body: rawBody,
    });

    const result = await response.json();
    return result;
  }

  public async syncSantriData(data: any[]) {
    /*
    |--------------------------------------------------------------------------
    | INSTITUTION
    |--------------------------------------------------------------------------
    */
    const institutionMap = new Map();
    for (const item of data) {
      if (!institutionMap.has(item.institution_id)) {
        institutionMap.set(item.institution_id, {
          id_institution: uuidv4(),
          institution_id_sitrendi: item.institution_id,
          institution_name: item.institution_name,
          status: item.is_active ? 1 : 0,
        });
      }
    }
    const institution = Array.from(institutionMap.values());
    await repoInstitution.bulkUpsert(institution);

    const institutionDb = await repoInstitution.list();
    const institutionPkMap = new Map(
      institutionDb.map((item: any) => [
        item.institution_id_sitrendi,
        item.id_institution,
      ])
    );

    /*
    |--------------------------------------------------------------------------
    | LEMBAGA PENDIDIKAN FORMAL
    |--------------------------------------------------------------------------
    */
    const uniqueInstitutions = new Map<string, string>();
    for (const item of data) {
      if (item.institution_id && item.institution_name) {
        uniqueInstitutions.set(item.institution_id, item.institution_name.trim());
      }
    }

    const lembagaFormalPkMap = new Map<string, string>();
    const lembagaFormalCabangMap = new Map<string, string | null>();

    for (const [institution_id, institution_name] of uniqueInstitutions.entries()) {
      const existing = await LembagaPendidikanFormal.findOne({
        where: {
          [Op.or]: [
            { institution_id_sitrendi: institution_id },
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('nama_lembaga')),
              institution_name.toLowerCase()
            ),
          ],
        },
      });

      if (existing) {
        if (existing.institution_id_sitrendi !== institution_id) {
          await existing.update({ institution_id_sitrendi: institution_id });
        }
        lembagaFormalPkMap.set(institution_id, existing.id_lembaga);
        lembagaFormalCabangMap.set(institution_id, existing.id_cabang || null);
      } else {
        const created = await LembagaPendidikanFormal.create({
          id_lembaga: uuidv4(),
          nama_lembaga: institution_name,
          institution_id_sitrendi: institution_id,
          id_cabang: null,
        });
        lembagaFormalPkMap.set(institution_id, created.id_lembaga);
        lembagaFormalCabangMap.set(institution_id, null);
      }
    }

    /*
    |--------------------------------------------------------------------------
    | WALI
    |--------------------------------------------------------------------------
    */
    const waliMap = new Map();
    for (const item of data) {
      let wali = item.wali;
      if (!waliMap.has(item.user_id) && wali) {
        waliMap.set(item.user_id, {
          id_wali: uuidv4(),
          id_wali_sitrendi: item.user_id,
          nama_wali: wali.nama_wali,
          no_hp: wali.no_hp,
          nik: wali.nik,
          alamat: wali.alamat,
          keterangan: wali.keterangan,
          hubungan: helper.waliData(wali.hubungan, 'hubungan'),
          pendidikan: helper.waliData(wali.pendidikan),
          pekerjaan: helper.waliData(wali.pekerjaan),
        });
      }
    }
    const wali = Array.from(waliMap.values());
    await repoWali.bulkUpsert(wali);

    const waliDb = await repoWali.all({});
    const waliPkMap = new Map(
      waliDb.map((item: any) => [item.id_wali_sitrendi, item.id_wali])
    );

    /*
    |--------------------------------------------------------------------------
    | SANTRI
    |--------------------------------------------------------------------------
    */
    const santriMap = new Map();
    for (const item of data) {
      if (item.is_active !== true) {
        continue;
      }
      const key = `${item.id}_${item.institution_id}`;

      if (!santriMap.has(key)) {
        santriMap.set(key, {
          id_santri: uuidv4(),
          fullname: item.full_name,
          nis: item.nis,
          nik: item.identity_number?.trim() || null,
          gender: item.gender,
          birth_place: item.birth_place,
          birth_date: item.birth_date,
          phone: item.phone,

          id_cabang: lembagaFormalCabangMap.get(item.institution_id) || null,
          nama_cabang: item.nama_cabang || null,

          id_institution: institutionPkMap.get(item.institution_id) || null,
          institution_name: item.institution_name,

          group_code_1: item.group_code_1,
          group_code_2: item.group_code_2,
          group_code_3: item.group_code_3,

          nomor_nasabah: item.nomor_nasabah,
          kartu_santri_nomor: item.kartu_santri_nomor,
          kartu_santri: item.kartu_santri,

          status: item.is_active ? 1 : 0,

          id_santri_sitrendi: item.id,
          institution_id_sitrendi: item.institution_id,
          id_wali_sitrendi: item.user_id,
          id_wali: waliPkMap.get(item.user_id) || null,
          id_lembaga_formal: lembagaFormalPkMap.get(item.institution_id) || null,
        });
      }
    }
    const santri = Array.from(santriMap.values());
    await repoSantri.bulkUpsert(santri);

    return {
      institution: institution.length,
      wali: wali.length,
      santri: santri.length,
    };
  }

  public async getSummary(
    tanggal?: string,
    tanggal_mulai?: string,
    tanggal_selesai?: string
  ) {
    const userContext = getUserContextData();
    let dateFilter: any;
    let dateTimeFilter: any;
    let startD: string;
    let endD: string;

    if (tanggal_mulai && tanggal_selesai) {
      dateFilter = { [Op.between]: [tanggal_mulai, tanggal_selesai] };
      dateTimeFilter = { [Op.between]: [`${tanggal_mulai} 00:00:00`, `${tanggal_selesai} 23:59:59`] };
      startD = tanggal_mulai;
      endD = tanggal_selesai;
    } else {
      const targetDate = tanggal || moment().tz(TIMEZONE).format('YYYY-MM-DD');
      dateFilter = targetDate;
      dateTimeFilter = { [Op.between]: [`${targetDate} 00:00:00`, `${targetDate} 23:59:59`] };
      startD = targetDate;
      endD = targetDate;
    }

    const [
      santriStats,
      absensiStats,
      absensiKelasStats,
      pegawaiStats,
      temuanStats,
      perizinanStats,
      absensiPegawaiStats,
      totalSesiGuru,
      kebersihanInspeksiStats,
      perizinanPegawaiStats,
      inspeksiProgress
    ] = await Promise.all([
      AppSantri.findAll({
        attributes: [
          'status',
          [Sequelize.fn('COUNT', Sequelize.col('id_santri')), 'count'],
        ],
        where: userContext?.id_cabang ? { id_cabang: userContext.id_cabang } : {},
        group: ['status'],
        raw: true,
      }),
      AbsenHarianSantri.findAll({
        attributes: [
          'status_kehadiran',
          [
            Sequelize.fn('COUNT', Sequelize.literal('DISTINCT "AbsenHarianSantri".id_santri')),
            'count',
          ],
        ],
        where: {
          tanggal: dateFilter,
          ...(userContext?.id_cabang ? { '$santri.id_cabang$': userContext.id_cabang } : {}),
        },
        include: userContext?.id_cabang ? [
          {
            model: AppSantri,
            as: 'santri',
            attributes: [],
            required: true,
          }
        ] : [],
        group: ['status_kehadiran'],
        raw: true,
      }),
      AbsenKelasSantri.findAll({
        attributes: [
          'status_kehadiran',
          [
            Sequelize.fn('COUNT', Sequelize.literal('DISTINCT "AbsenKelasSantri".id_santri')),
            'count',
          ],
        ],
        where: {
          tanggal: dateFilter,
          ...(userContext?.id_cabang ? { '$santri.id_cabang$': userContext.id_cabang } : {}),
        },
        include: userContext?.id_cabang ? [
          {
            model: AppSantri,
            as: 'santri',
            attributes: [],
            required: true,
          }
        ] : [],
        group: ['status_kehadiran'],
        raw: true,
      }),
      Pegawai.findAll({
        attributes: [
          [
            Sequelize.literal(`
              CASE 
                WHEN id_pegawai IN (SELECT DISTINCT id_guru FROM jenis_guru WHERE id_guru IS NOT NULL) 
                THEN 'GURU' 
                ELSE 'PEGAWAI' END
              `),
            'role',
          ],
          [Sequelize.fn('COUNT', Sequelize.col('id_pegawai')), 'count'],
        ],
        where: {
          status_pegawai: 'Aktif',
          ...(userContext?.id_cabang ? { '$organizationUnit.id_cabang$': userContext.id_cabang } : {}),
        },
        include: userContext?.id_cabang ? [
          {
            model: OrganizationUnit,
            as: 'organizationUnit',
            attributes: [],
            required: true,
          }
        ] : [],
        group: [
          Sequelize.literal(`
          CASE 
            WHEN id_pegawai IN (SELECT DISTINCT id_guru FROM jenis_guru WHERE id_guru IS NOT NULL) THEN 'GURU' 
            ELSE 'PEGAWAI' 
          END
        `) as any,
        ],
        raw: true,
      }),
      KebersihanTemuan.findAll({
        include: [
          {
            model: KebersihanInspeksi,
            as: 'kebersihan_inspeksi',
            attributes: [],
            required: true,
            where: userContext?.id_cabang ? { id_cabang: userContext.id_cabang } : {},
          },
        ],
        attributes: [
          [Sequelize.col('kebersihan_inspeksi.status_kondisi'), 'status_kondisi'],
          [Sequelize.fn('COUNT', Sequelize.col('id_temuan')), 'count'],
        ],
        where: {
          created_at: dateTimeFilter,
          status: { [Op.in]: [0, 1] },
        },
        group: [Sequelize.col('kebersihan_inspeksi.status_kondisi')],
        raw: true,
      }),
      PerizinanSantri.findAll({
        attributes: [
          'status_approval',
          'kondisi',
          [Sequelize.fn('COUNT', Sequelize.col('id_izin')), 'count'],
        ],
        where: {
          created_at: dateTimeFilter,
          is_canceled: false,
          id_santri: { [Op.ne]: null },
          ...(userContext?.id_cabang ? { '$santri.id_cabang$': userContext.id_cabang } : {}),
        },
        include: userContext?.id_cabang ? [
          {
            model: AppSantri,
            as: 'santri',
            attributes: [],
            required: true,
          }
        ] : [],
        group: ['status_approval', 'kondisi'],
        raw: true,
      }),
      AbsenHarianPegawai.findAll({
        attributes: [
          'status_kehadiran',
          [
            Sequelize.fn('COUNT', Sequelize.literal('DISTINCT "AbsenHarianPegawai"."id_pegawai"')),
            'count',
          ],
        ],
        where: { tanggal: dateFilter },
        include: userContext?.id_cabang ? [
          {
            model: Pegawai,
            as: 'pegawai',
            attributes: [],
            required: true,
            include: [
              {
                model: OrganizationUnit,
                as: 'organizationUnit',
                attributes: [],
                required: true,
                where: {
                  id_cabang: userContext.id_cabang,
                },
              }
            ]
          }
        ] : [],
        group: ['status_kehadiran'],
        raw: true,
      }),
      JurnalKelas.count({
        where: {
          tanggal: dateFilter,
          ...(userContext?.id_lembaga ? {
            [Op.or]: [
              { '$kelasMda.id_lembaga$': userContext.id_lembaga },
              { '$kelasFormal.id_lembaga$': userContext.id_lembaga },
            ]
          } : {})
        },
        include: userContext?.id_lembaga ? [
          {
            model: KelasMda,
            as: 'kelasMda',
            attributes: [],
            required: false,
          },
          {
            model: KelasFormal,
            as: 'kelasFormal',
            attributes: [],
            required: false,
          }
        ] : []
      }),
      KebersihanInspeksi.findOne({
        attributes: [
          [
            Sequelize.fn('COUNT', Sequelize.literal('DISTINCT id_petugas')),
            'count',
          ],
        ],
        where: {
          tanggal: dateFilter,
          ...(userContext?.id_cabang ? { id_cabang: userContext.id_cabang } : {}),
        },
        raw: true,
      }),
      PerizinanSantri.findAll({
        attributes: [
          'status_approval',
          'kondisi',
          [Sequelize.fn('COUNT', Sequelize.col('id_izin')), 'count'],
        ],
        where: {
          created_at: dateTimeFilter,
          is_canceled: false,
          id_pegawai: { [Op.ne]: null },
          ...(userContext?.id_cabang ? { '$lokasiKerja.id_cabang$': userContext.id_cabang } : {}),
        },
        include: userContext?.id_cabang ? [
          {
            model: Lokasi,
            as: 'lokasiKerja',
            attributes: [],
            required: true,
          }
        ] : [],
        group: ['status_approval', 'kondisi'],
        raw: true,
      }),
      (async () => {
        const conn = await rawQuery.getConnection();
        const idCabangFilter = userContext?.id_cabang ? 'AND jik.id_cabang = :id_cabang' : '';
        const idCabangKiFilter = userContext?.id_cabang ? 'AND ki.id_cabang = :id_cabang' : '';

        const summaryQuery = `
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
                jik.kode_slot
            FROM tanggal t
            JOIN jadwal_inspeksi_kebersihan jik
              ON jik.hari = EXTRACT(ISODOW FROM t.tanggal)
            JOIN pegawai p
              ON p.id_pegawai = jik.id_petugas
            WHERE jik.is_active = true
              ${idCabangFilter}
        )
        SELECT
            COUNT(*) AS total_jadwal,
            COUNT(ki.id_inspeksi) AS inspeksi
        FROM jadwal j
        LEFT JOIN kebersihan_inspeksi ki
              ON ki.tanggal = j.tanggal
              AND ki.kode_slot::text = j.kode_slot::text
              AND ki.id_petugas = j.id_petugas
              ${idCabangKiFilter}
        `;

        const [rows]: any = await conn.query(summaryQuery, {
          type: QueryTypes.SELECT,
          replacements: {
            startperiod: startD,
            endperiod: endD,
            ...(userContext?.id_cabang ? { id_cabang: userContext.id_cabang } : {}),
          },
        });
        return rows;
      })()
    ]) as any;

    let activeSantri = 0;
    let totalSantri = 0;
    for (const item of santriStats) {
      const countVal = parseInt(item.count, 10) || 0;
      const statusVal = parseInt(item.status, 10);
      if (statusVal == 1) {
        activeSantri = countVal;
      }
      if (statusVal != 9) {
        totalSantri += countVal;
      }
    }
    const persentaseActive =
      totalSantri > 0
        ? parseFloat(((activeSantri / totalSantri) * 100).toFixed(1))
        : 0;

    let totalHadir = 0;
    let totalIzin = 0;
    let totalSakit = 0;
    let totalAlfa = 0;

    for (const item of absensiStats) {
      const countVal = parseInt(item.count, 10) || 0;
      if (item.status_kehadiran == 'Hadir') totalHadir = countVal;
      else if (item.status_kehadiran == 'Izin') totalIzin = countVal;
      else if (item.status_kehadiran == 'Sakit') totalSakit = countVal;
      else if (item.status_kehadiran == 'Alfa') totalAlfa = countVal;
    }

    const persentaseAbsensi =
      activeSantri > 0
        ? parseFloat(((totalHadir / activeSantri) * 100).toFixed(1))
        : 0;
    const persentaseIzin =
      activeSantri > 0
        ? parseFloat(((totalIzin / activeSantri) * 100).toFixed(1))
        : 0;
    const persentaseSakit =
      activeSantri > 0
        ? parseFloat(((totalSakit / activeSantri) * 100).toFixed(1))
        : 0;
    const persentaseAlfa =
      activeSantri > 0
        ? parseFloat(((totalAlfa / activeSantri) * 100).toFixed(1))
        : 0;

    let totalKelasHadir = 0;
    let totalKelasIzin = 0;
    let totalKelasSakit = 0;
    let totalKelasAlfa = 0;

    for (const item of absensiKelasStats) {
      const countVal = parseInt(item.count, 10) || 0;
      if (item.status_kehadiran == 'Hadir') totalKelasHadir = countVal;
      else if (item.status_kehadiran == 'Izin') totalKelasIzin = countVal;
      else if (item.status_kehadiran == 'Sakit') totalKelasSakit = countVal;
      else if (item.status_kehadiran == 'Alfa') totalKelasAlfa = countVal;
    }

    const persentaseKelasAbsensi =
      activeSantri > 0
        ? parseFloat(((totalKelasHadir / activeSantri) * 100).toFixed(1))
        : 0;
    const persentaseKelasIzin =
      activeSantri > 0
        ? parseFloat(((totalKelasIzin / activeSantri) * 100).toFixed(1))
        : 0;
    const persentaseKelasSakit =
      activeSantri > 0
        ? parseFloat(((totalKelasSakit / activeSantri) * 100).toFixed(1))
        : 0;
    const persentaseKelasAlfa =
      activeSantri > 0
        ? parseFloat(((totalKelasAlfa / activeSantri) * 100).toFixed(1))
        : 0;

    let totalGuruAktif = 0;
    let totalPegawaiAktif = 0;
    for (const item of pegawaiStats) {
      const countVal = parseInt(item.count, 10) || 0;
      if (item.role === 'GURU') totalGuruAktif = countVal;
      else if (item.role === 'PEGAWAI') totalPegawaiAktif = countVal;
    }

    let total_temuan = 0;
    let temuan_kotor = 0;
    let temuan_rusak = 0;
    for (const item of temuanStats) {
      const countVal = parseInt(item.count, 10) || 0;
      total_temuan += countVal;
      const statusKondisi =
        item.status_kondisi || item['kebersihan_inspeksi.status_kondisi'];
      if (statusKondisi === 'KOTOR') temuan_kotor = countVal;
      else if (statusKondisi === 'RUSAK') temuan_rusak = countVal;
    }

    let total_perizinan = 0;
    let perizinan_menunggu = 0;
    let perizinan_disetujui = 0;
    let perizinan_overdue = 0;

    for (const item of perizinanStats) {
      const countVal = parseInt(item.count, 10) || 0;
      const status = item.status_approval;
      const kondisi = item.kondisi;

      if (
        ['Rumah', 'Kembali', 'Menunggu', 'Disetujui'].includes(status) &&
        (!kondisi || !['Closed', 'Arsip'].includes(kondisi))
      ) {
        total_perizinan += countVal;
      }

      if (
        status === 'Menunggu' &&
        (!kondisi || !['Closed', 'Arsip'].includes(kondisi))
      ) {
        perizinan_menunggu += countVal;
      }

      if (
        status === 'Disetujui' &&
        (!kondisi || !['Closed', 'Arsip'].includes(kondisi))
      ) {
        perizinan_disetujui += countVal;
      }

      if (kondisi === 'Overdue') {
        perizinan_overdue += countVal;
      }
    }

    let totalPegawaiHadir = 0;
    let totalPegawaiIzin = 0;
    let totalPegawaiSakit = 0;
    let totalPegawaiAlfa = 0;

    for (const item of absensiPegawaiStats) {
      const countVal = parseInt(item.count, 10) || 0;
      if (item.status_kehadiran == 'Hadir') totalPegawaiHadir = countVal;
      else if (item.status_kehadiran == 'Izin') totalPegawaiIzin = countVal;
      else if (item.status_kehadiran == 'Sakit') totalPegawaiSakit = countVal;
      else if (item.status_kehadiran == 'Alfa') totalPegawaiAlfa = countVal;
    }

    const totalPegawaiAktifSum = totalGuruAktif + totalPegawaiAktif;

    const persentasePegawaiAbsensi =
      totalPegawaiAktifSum > 0
        ? parseFloat(((totalPegawaiHadir / totalPegawaiAktifSum) * 100).toFixed(1))
        : 0;
    const persentasePegawaiIzin =
      totalPegawaiAktifSum > 0
        ? parseFloat(((totalPegawaiIzin / totalPegawaiAktifSum) * 100).toFixed(1))
        : 0;
    const persentasePegawaiSakit =
      totalPegawaiAktifSum > 0
        ? parseFloat(((totalPegawaiSakit / totalPegawaiAktifSum) * 100).toFixed(1))
        : 0;
    const persentasePegawaiAlfa =
      totalPegawaiAktifSum > 0
        ? parseFloat(((totalPegawaiAlfa / totalPegawaiAktifSum) * 100).toFixed(1))
        : 0;

    const totalPetugasInspeksi = parseInt(kebersihanInspeksiStats?.count, 10) || 0;

    let total_perizinan_pegawai = 0;
    let perizinan_pegawai_menunggu = 0;
    let perizinan_pegawai_disetujui = 0;
    let perizinan_pegawai_overdue = 0;

    for (const item of perizinanPegawaiStats) {
      const countVal = parseInt(item.count, 10) || 0;
      const status = item.status_approval;
      const kondisi = item.kondisi;

      if (
        ['Menunggu', 'Disetujui'].includes(status) &&
        (!kondisi || !['Closed', 'Arsip'].includes(kondisi))
      ) {
        total_perizinan_pegawai += countVal;
      }

      if (
        status === 'Menunggu' &&
        (!kondisi || !['Closed', 'Arsip'].includes(kondisi))
      ) {
        perizinan_pegawai_menunggu += countVal;
      }

      if (
        status === 'Disetujui' &&
        (!kondisi || !['Closed', 'Arsip'].includes(kondisi))
      ) {
        perizinan_pegawai_disetujui += countVal;
      }

      if (kondisi === 'Overdue') {
        perizinan_pegawai_overdue += countVal;
      }
    }

    return {
      total_santri: {
        aktif: activeSantri,
        keseluruhan: totalSantri,
        persentase: persentaseActive,
      },
      total_guru_aktif: totalGuruAktif,
      total_pegawai_aktif: totalPegawaiAktif,
      total_absensi: {
        hadir: totalHadir,
        persentase: persentaseAbsensi,
        izin: totalIzin,
        persentase_izin: persentaseIzin,
        sakit: totalSakit,
        persentase_sakit: persentaseSakit,
        alfa: totalAlfa,
        persentase_alfa: persentaseAlfa,
      },
      total_absensi_kelas: {
        hadir: totalKelasHadir,
        persentase: persentaseKelasAbsensi,
        izin: totalKelasIzin,
        persentase_izin: persentaseKelasIzin,
        sakit: totalKelasSakit,
        persentase_sakit: persentaseKelasSakit,
        alfa: totalKelasAlfa,
        persentase_alfa: persentaseKelasAlfa,
      },
      total_temuan,
      temuan_kotor,
      temuan_rusak,
      total_perizinan,
      perizinan_menunggu,
      perizinan_disetujui,
      perizinan_overdue,
      total_absensi_pegawai: {
        hadir: totalPegawaiHadir,
        persentase: persentasePegawaiAbsensi,
        izin: totalPegawaiIzin,
        persentase_izin: persentasePegawaiIzin,
        sakit: totalPegawaiSakit,
        persentase_sakit: persentasePegawaiSakit,
        alfa: totalPegawaiAlfa,
        persentase_alfa: persentasePegawaiAlfa,
      },
      total_sesi_guru: totalSesiGuru,
      total_petugas_inspeksi: totalPetugasInspeksi,
      petugas_inspeksi_progress: {
        target: parseInt(inspeksiProgress?.total_jadwal, 10) || 0,
        actual: parseInt(inspeksiProgress?.inspeksi, 10) || 0,
      },
      total_perizinan_pegawai: {
        total: total_perizinan_pegawai,
        menunggu: perizinan_pegawai_menunggu,
        disetujui: perizinan_pegawai_disetujui,
        overdue: perizinan_pegawai_overdue,
      },
    };
  }

  public async sendNotification(data: NotificationPayload) {
    if (!ONESIGNAL_URL) return 'Belum setup url OneSignal';
    if (!ONESIGNAL_APP_ID) return 'Belum setup app_id OneSignal';
    if (!ONESIGNAL_APP_KEY) return 'Belum setup app_key OneSignal';

    const response = await fetch(`${ONESIGNAL_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${ONESIGNAL_APP_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        headings: {
          en: data.title,
        },
        contents: {
          en: data.message,
        },
        target_channel: 'push',
        include_aliases: {
          external_id: data.receiver,
        },
        url: data.url,
      }),
    });

    const result = await response.json();

    return result;
  }

  public async mapSantriRelations() {
    const santris = await AppSantri.findAll({
      where: {
        status: { [Op.ne]: 9 }
      }
    });

    let mappedCount = 0;

    for (const santri of santris) {
      const activeClass = await PenempatanKelasSantri.findOne({
        where: { id_santri: santri.id_santri, status: 'Aktif' },
        include: [
          {
            model: KelasFormal,
            as: 'kelasFormal',
            include: [
              {
                model: LembagaPendidikanFormal,
                as: 'lembaga',
                include: [
                  {
                    model: Cabang,
                    as: 'cabang'
                  }
                ]
              }
            ]
          },
          {
            model: KelasMda,
            as: 'kelasMda',
            include: [
              {
                model: LembagaPendidikanKepesantrenan,
                as: 'lembaga',
                include: [
                  {
                    model: Cabang,
                    as: 'cabang'
                  }
                ]
              }
            ]
          }
        ]
      });

      const activeRoom = await PenempatanKamarSantri.findOne({
        where: { id_santri: santri.id_santri, status: 'Aktif' },
        include: [
          {
            model: Lokasi,
            as: 'lokasi',
            include: [
              {
                model: Cabang,
                as: 'cabang'
              }
            ]
          }
        ]
      });

      if (activeClass || activeRoom) {
        let id_kelas_formal = activeClass?.id_kelas_formal || null;
        let id_kelas_mda = activeClass?.id_kelas_mda || null;
        let id_lembaga_formal = activeClass?.kelasFormal?.id_lembaga || null;
        let id_lembaga_mda = activeClass?.kelasMda?.id_lembaga || null;
        
        let id_cabang: string | null = null;
        let nama_cabang: string | null = null;

        if (activeClass?.kelasFormal?.lembaga?.id_cabang) {
          id_cabang = activeClass.kelasFormal.lembaga.id_cabang;
          nama_cabang = activeClass.kelasFormal.lembaga.cabang?.nama_cabang || null;
        } else if (activeClass?.kelasMda?.lembaga?.id_cabang) {
          id_cabang = activeClass.kelasMda.lembaga.id_cabang;
          nama_cabang = activeClass.kelasMda.lembaga.cabang?.nama_cabang || null;
        } else if (activeRoom?.lokasi?.id_cabang) {
          id_cabang = activeRoom.lokasi.id_cabang;
          nama_cabang = activeRoom.lokasi.cabang?.nama_cabang || null;
        }

        await santri.update({
          id_cabang,
          nama_cabang,
          id_lembaga_formal,
          id_lembaga_mda,
          id_kelas_formal,
          id_kelas_mda,
          updated_at: helper.date(),
        });

        mappedCount++;
      }
    }

    return {
      total_santri_processed: santris.length,
      mapped_count: mappedCount
    };
  }
}

export const service = new Service();
