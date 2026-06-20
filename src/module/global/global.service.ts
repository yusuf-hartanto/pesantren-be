import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { helper } from '../../helpers/helper';
import { repository as repoCabang } from '../app/cabang/cabang.repository';
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
import { Op, Sequelize } from 'sequelize';
import moment from 'moment';

const BASE_URL = process.env.SITRENDI_URL || '';
const SECRET_KEY = process.env.SITRENDI_SECRET_KEY || '';

interface SyncSantriPayload {
  institution_id: string;
  kelas: string;
  user_id: string;
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
    | CABANG
    |--------------------------------------------------------------------------
    */
    const cabangMap = new Map();
    for (const item of data) {
      if (!cabangMap.has(item.institution_id)) {
        cabangMap.set(item.institution_id, {
          id_cabang: uuidv4(),
          institution_id_sitrendi: item.institution_id,
          nama_cabang: item.institution_name,
        });
      }
    }
    const cabang = Array.from(cabangMap.values());
    await repoCabang.bulkUpsert(cabang);

    const cabangDb = await repoCabang.all({});
    const cabangPkMap = new Map(
      cabangDb.map((item: any) => [
        item.institution_id_sitrendi,
        item.id_cabang,
      ])
    );

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

          id_cabang: cabangPkMap.get(item.institution_id) || null,
          nama_cabang: item.institution_name,

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
    let dateFilter: any;

    if (tanggal_mulai && tanggal_selesai) {
      dateFilter = { [Op.between]: [tanggal_mulai, tanggal_selesai] };
    } else {
      dateFilter = tanggal || moment().format('YYYY-MM-DD');
    }

    const santriStats = (await AppSantri.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id_santri')), 'count'],
      ],
      group: ['status'],
      raw: true,
    })) as any[];

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

    const absensiStats = (await AbsenHarianSantri.findAll({
      attributes: [
        'status_kehadiran',
        [
          Sequelize.fn('COUNT', Sequelize.literal('DISTINCT id_santri')),
          'count',
        ],
      ],
      where: { tanggal: dateFilter },
      group: ['status_kehadiran'],
      raw: true,
    })) as any[];

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

    const absensiKelasStats = (await AbsenKelasSantri.findAll({
      attributes: [
        'status_kehadiran',
        [
          Sequelize.fn('COUNT', Sequelize.literal('DISTINCT id_santri')),
          'count',
        ],
      ],
      where: { tanggal: dateFilter },
      group: ['status_kehadiran'],
      raw: true,
    })) as any[];

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

    const pegawaiStats = (await Pegawai.findAll({
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
      where: { status_pegawai: 'Aktif' },
      group: [
        Sequelize.literal(`
        CASE 
          WHEN id_pegawai IN (SELECT DISTINCT id_guru FROM jenis_guru WHERE id_guru IS NOT NULL) THEN 'GURU' 
          ELSE 'PEGAWAI' 
        END
      `) as any,
      ],
      raw: true,
    })) as any[];

    let totalGuruAktif = 0;
    let totalPegawaiAktif = 0;
    for (const item of pegawaiStats) {
      const countVal = parseInt(item.count, 10) || 0;
      if (item.role === 'GURU') totalGuruAktif = countVal;
      else if (item.role === 'PEGAWAI') totalPegawaiAktif = countVal;
    }

    const temuanStats = (await KebersihanTemuan.findAll({
      include: [
        {
          model: KebersihanInspeksi,
          as: 'kebersihan_inspeksi',
          attributes: [],
          required: true,
        },
      ],
      attributes: [
        [Sequelize.col('kebersihan_inspeksi.status_kondisi'), 'status_kondisi'],
        [Sequelize.fn('COUNT', Sequelize.col('id_temuan')), 'count'],
      ],
      where: {
        created_at: dateFilter,
        status: { [Op.in]: [0, 1] },
      },
      group: [Sequelize.col('kebersihan_inspeksi.status_kondisi')],
      raw: true,
    })) as any[];

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

    const perizinanStats = (await PerizinanSantri.findAll({
      attributes: [
        'status_approval',
        'kondisi',
        [Sequelize.fn('COUNT', Sequelize.col('id_izin')), 'count'],
      ],
      where: {
        created_at: dateFilter,
        is_canceled: false,
      },
      group: ['status_approval', 'kondisi'],
      raw: true,
    })) as any[];

    let total_perizinan = 0;
    let perizinan_menunggu = 0;
    let perizinan_disetujui = 0;
    let perizinan_overdue = 0;

    for (const item of perizinanStats) {
      const countVal = parseInt(item.count, 10) || 0;
      const status = item.status_approval;
      const kondisi = item.kondisi;

      if (
        ['Menunggu', 'Disetujui'].includes(status) &&
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
    };
  }
}

export const service = new Service();
