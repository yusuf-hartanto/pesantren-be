'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { response } from '../../../helpers/response';
import { repository } from './pegawai.absen.harian.repository';
import { repository as pegawaiRepo } from '../pegawai/pegawai.repository';
import { repository as jamKerjaRepo } from '../pegawai.jam.kerja/pegawai.jam.kerja.repository';
import * as geolib from 'geolib'; // Import library geolib
import moment from 'moment-timezone';
import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import {
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  TIMEZONE,
} from '../../../utils/constant';
import { clockInSchema, clockOutSchema } from './pegawai.absen.harian.schema';
import z from 'zod';

const generateDataExcel = (
  sheet: any,
  details: any,
  isTemplate: boolean = false
) => {
  sheet.addRow([
    'No',
    'ID Pegawai',
    'Nama Pegawai',
    'Tanggal (YYYY-MM-DD)',
    'Waktu Masuk (YYYY-MM-DD HH:mm:ss)',
    'Waktu Keluar (YYYY-MM-DD HH:mm:ss)',
    'Keterangan Masuk',
    'Keterangan Keluar',
    'Lat Masuk',
    'Long Masuk',
    'Lat Keluar',
    'Long Keluar',
    'Status Kehadiran (Hadir/Izin/Sakit/Alfa)',
  ]);

  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'ID Pegawai', key: 'id_pegawai', width: 25 },
    { header: 'Nama Pegawai', key: 'nama_pegawai', width: 25 },
    { header: 'Tanggal (YYYY-MM-DD)', key: 'tanggal', width: 15 },
    {
      header: 'Waktu Masuk (YYYY-MM-DD HH:mm:ss)',
      key: 'waktu_masuk',
      width: 25,
    },
    {
      header: 'Waktu Keluar (YYYY-MM-DD HH:mm:ss)',
      key: 'waktu_keluar',
      width: 25,
    },
    { header: 'Keterangan Masuk', key: 'keterangan_masuk', width: 30 },
    { header: 'Keterangan Keluar', key: 'keterangan_keluar', width: 30 },
    { header: 'Lat Masuk', key: 'lat_masuk', width: 15 },
    { header: 'Long Masuk', key: 'long_masuk', width: 15 },
    { header: 'Lat Keluar', key: 'lat_keluar', width: 15 },
    { header: 'Long Keluar', key: 'long_keluar', width: 15 },
    {
      header: 'Status Kehadiran (Hadir/Izin/Sakit/Alfa)',
      key: 'status_kehadiran',
      width: 25,
    },
  ];

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    const rowData = details[i];
    sheet.addRow([
      parseInt(i) + 1,
      rowData?.id_pegawai || '',
      rowData?.pegawai?.nama_lengkap || '',
      rowData?.tanggal || '',
      rowData?.waktu_masuk || '',
      rowData?.waktu_keluar || '',
      rowData?.keterangan_masuk || '',
      rowData?.keterangan_keluar || '',
      rowData?.lat_masuk || '',
      rowData?.long_masuk || '',
      rowData?.lat_keluar || '',
      rowData?.long_keluar || '',
      rowData?.status_kehadiran || 'Hadir',
    ]);
  }

  const columnCount = sheet.columns.length;
  for (let row = 1; row <= (details?.length || 0) + 1; row++) {
    const currentRow = sheet.getRow(row);
    for (let col = 1; col <= columnCount; col++) {
      const cell = currentRow.getCell(col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    }
  }
  return sheet;
};

const normalizeRow = (row: any) => {
  const parseDateTimeStr = (val: any) => {
    if (!val) return null;
    if (moment(val, 'YYYY-MM-DD HH:mm:ss', true).isValid())
      return String(val).trim();
    if (moment(val).isValid()) return moment(val).format('YYYY-MM-DD HH:mm:ss');
    return String(val).trim();
  };

  const parseDateStr = (val: any) => {
    if (!val) return moment().tz(TIMEZONE).format('YYYY-MM-DD');
    if (moment(val, 'YYYY-MM-DD', true).isValid()) return String(val).trim();
    if (moment(val).isValid()) return moment(val).format('YYYY-MM-DD');
    return String(val).trim();
  };

  return {
    id_pegawai: String(row['ID Pegawai'] || '').trim(),
    tanggal: parseDateStr(row['Tanggal (YYYY-MM-DD)']),
    waktu_masuk: parseDateTimeStr(row['Waktu Masuk (YYYY-MM-DD HH:mm:ss)']),
    waktu_keluar: parseDateTimeStr(row['Waktu Keluar (YYYY-MM-DD HH:mm:ss)']),
    keterangan_masuk: String(row['Keterangan Masuk'] || '').trim(),
    keterangan_keluar: String(row['Keterangan Keluar'] || '').trim(),
    lat_masuk: row['Lat Masuk'] ? parseFloat(row['Lat Masuk']) : null,
    long_masuk: row['Long Masuk'] ? parseFloat(row['Long Masuk']) : null,
    lat_keluar: row['Lat Keluar'] ? parseFloat(row['Lat Keluar']) : null,
    long_keluar: row['Long Keluar'] ? parseFloat(row['Long Keluar']) : null,
    status_kehadiran: String(
      row['Status Kehadiran (Hadir/Izin/Sakit/Alfa)'] || 'Hadir'
    ).trim(),
    __row: row.__row,
  };
};

export default class Controller {
  constructor() {
    this.clockIn = this.clockIn.bind(this);
    this.clockOut = this.clockOut.bind(this);
    this.import = this.import.bind(this);
    this.insert = this.insert.bind(this);
    this.export = this.export.bind(this);
  }

  private async validateRow(row: any) {
    const errors: string[] = [];

    if (!row.id_pegawai) errors.push('ID Pegawai wajib diisi');
    if (!row.tanggal) errors.push('Tanggal absensi wajib diisi');

    const validEnum = ['Hadir', 'Izin', 'Sakit', 'Alfa'];
    if (!validEnum.includes(row.status_kehadiran)) {
      errors.push(
        `Status Kehadiran harus salah satu dari: ${validEnum.join('/')}`
      );
    }

    if (row.id_pegawai) {
      const peg = await pegawaiRepo.detail({ id_pegawai: row.id_pegawai });
      if (!peg) {
        errors.push(`Pegawai dengan ID "${row.id_pegawai}" tidak ditemukan`);
      } else {
        const jk = await jamKerjaRepo.checkDuplicatePegawai(row.id_pegawai);
        if (!jk) {
          errors.push(
            `Pegawai [${peg.nama_lengkap}] belum dikonfigurasi acuan Master Jam Kerjanya.`
          );
        } else {
          row.id_jamkerja = jk.id_jamkerja;
        }
      }
    }

    return errors;
  }

  // --- API ENGINE CLOCK-IN / CLOCK-OUT ---

  public async clockIn(req: Request, res: Response) {
    try {
      const validBody = clockInSchema.parse(req.body);
      const { id_pegawai, latitude, longitude, catatan } = validBody;

      const tanggalHariIni = moment().tz(TIMEZONE).format('YYYY-MM-DD');
      const waktuSekarang = moment().tz(TIMEZONE);

      const jamKerjaMaster =
        await jamKerjaRepo.checkDuplicatePegawai(id_pegawai);
      if (!jamKerjaMaster || !jamKerjaMaster.is_active) {
        return helper.catchError(
          'Pegawai belum memiliki master acuan jam kerja yang aktif.',
          400,
          res
        );
      }

      const geoAreaRaw = await repository.getActiveGeoLocation(
        jamKerjaMaster.id_lokasi
      );
      const geoArea = geoAreaRaw ? geoAreaRaw.dataValues : null;

      if (!geoArea) {
        return helper.catchError(
          'Area koordinat lokasi penugasan tidak ditemukan/tidak aktif.',
          400,
          res
        );
      }

      if (geoArea.tipe_geo === 'CIRCLE' || geoArea.tipe_geo === 'POINT') {
        const batasAman =
          (geoArea.radius_meter || 0) + (geoArea.toleransi_meter || 0);

        const isInside = geolib.isPointWithinRadius(
          { latitude: latitude, longitude: longitude },
          {
            latitude: parseFloat(geoArea.latitude as any),
            longitude: parseFloat(geoArea.longitude as any),
          },
          batasAman
        );

        if (!isInside) {
          const jarakReal = geolib.getDistance(
            { latitude: latitude, longitude: longitude },
            {
              latitude: parseFloat(geoArea.latitude as any),
              longitude: parseFloat(geoArea.longitude as any),
            }
          );
          return helper.catchError(
            `Gagal Absen! Anda berada di luar radius penugasan (${jarakReal} meter dari titik pusat kantor).`,
            400,
            res
          );
        }
      }

      const checkAttendance = await repository.findAttendanceToday(
        id_pegawai,
        tanggalHariIni
      );
      if (checkAttendance && checkAttendance.waktu_masuk) {
        return helper.catchError(
          'Anda sudah melakukan absensi masuk (Clock In) untuk hari ini.',
          400,
          res
        );
      }

      const acuanMasuk = moment(
        `${tanggalHariIni} ${jamKerjaMaster.waktu_mulai}`,
        'YYYY-MM-DD HH:mm:ss'
      );
      const selisihMenit = waktuSekarang.diff(acuanMasuk, 'minutes');

      let keteranganMasuk = '';
      if (selisihMenit > 0) {
        keteranganMasuk = `Terlambat masuk ${selisihMenit} menit. Catatan: ${catatan}`;
      } else {
        keteranganMasuk = `Hadir lebih awal ${Math.abs(selisihMenit)} menit. Catatan: ${catatan}`;
      }

      const payloadAbsen = {
        id_jamkerja: jamKerjaMaster.id_jamkerja,
        id_pegawai,
        tanggal: tanggalHariIni,
        waktu_masuk: waktuSekarang.format('YYYY-MM-DD HH:mm:ss'),
        keterangan_masuk: keteranganMasuk.trim(),
        lat_masuk: latitude,
        long_masuk: longitude,
        status_kehadiran: 'Hadir',
      };

      await repository.create([payloadAbsen]);

      const dataMessage = {
        title: 'Absen Harian Pegawai',
        message: `Absen Masuk (Clock In) pada tanggal ${tanggalHariIni} berhasil`,
        url: `/app/pegawai-absen-harian`,
        receiver: req.user?.username,
        type: 'Absen Harian Pegawai',
      };
      helper.sendNotification(req, dataMessage);

      return response.success(
        'Berhasil melakukan absensi masuk (Clock In). Selamat Bekerja!',
        null,
        res
      );
    } catch (err: any) {
      const msg =
        err instanceof z.ZodError
          ? `Validasi Payload Gagal: ${err.issues[0].message}`
          : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async clockOut(req: Request, res: Response) {
    try {
      const validBody = clockOutSchema.parse(req.body);
      const { id_pegawai, latitude, longitude, catatan } = validBody;

      const tanggalHariIni = moment().tz(TIMEZONE).format('YYYY-MM-DD');
      const waktuSekarang = moment.tz(TIMEZONE);

      const attendance = await repository.findAttendanceToday(
        id_pegawai,
        tanggalHariIni
      );
      if (!attendance) {
        return helper.catchError(
          'Gagal Pulang! Anda belum memiliki catatan absen masuk (Clock In) hari ini.',
          400,
          res
        );
      }
      if (attendance.waktu_keluar) {
        return helper.catchError(
          'Anda sudah melakukan absensi pulang (Clock Out) sebelumnya.',
          400,
          res
        );
      }

      const jamKerjaMaster = await jamKerjaRepo.detail({
        id_jamkerja: attendance.id_jamkerja,
      });
      if (!jamKerjaMaster) {
        return helper.catchError(
          'Referensi Master jam kerja tidak ditemukan.',
          400,
          res
        );
      }

      const geoArea = await repository.getActiveGeoLocation(
        jamKerjaMaster.id_lokasi
      );
      if (
        geoArea &&
        (geoArea.tipe_geo === 'CIRCLE' || geoArea.tipe_geo === 'POINT')
      ) {
        const batasAman =
          (geoArea.radius_meter || 0) + (geoArea.toleransi_meter || 0);

        const isInside = geolib.isPointWithinRadius(
          { latitude: latitude, longitude: longitude },
          {
            latitude: parseFloat(geoArea.latitude as any),
            longitude: parseFloat(geoArea.longitude as any),
          },
          batasAman
        );

        if (!isInside) {
          return helper.catchError(
            `Gagal Absen Pulang! Anda berada di luar radius penugasan resmi kantor.`,
            400,
            res
          );
        }
      }

      const acuanPulang = moment(
        `${tanggalHariIni} ${jamKerjaMaster.waktu_selesai}`,
        'YYYY-MM-DD HH:mm:ss'
      );
      const selisihMenit = waktuSekarang.diff(acuanPulang, 'minutes');

      let keteranganKeluar = '';
      if (selisihMenit < 0) {
        keteranganKeluar = `Pulang cepat (Early Checkout) ${Math.abs(selisihMenit)} menit sebelum waktunya. Catatan: ${catatan}`;
      } else {
        keteranganKeluar = `Pulang kerja sesuai waktu resmi (Overtime +${selisihMenit} menit). Catatan: ${catatan}`;
      }

      await repository.update({
        payload: {
          waktu_keluar: waktuSekarang.format('YYYY-MM-DD HH:mm:ss'),
          keterangan_keluar: keteranganKeluar.trim(),
          lat_keluar: latitude,
          long_keluar: longitude,
          updated_at: helper.date(),
        },
        condition: { id_absen: attendance.id_absen },
      });

      const dataMessage = {
        title: 'Absen Harian Pegawai',
        message: `Absen Pulang (Clock Out) pada tanggal ${tanggalHariIni} berhasil`,
        url: `/app/pegawai-absen-harian`,
        receiver: req.user?.username,
        type: 'Absen Harian Pegawai',
      };
      helper.sendNotification(req, dataMessage);

      return response.success(
        'Berhasil melakukan absensi pulang (Clock Out). Terima kasih atas kerja keras Anda!',
        null,
        res
      );
    } catch (err: any) {
      const msg =
        err instanceof z.ZodError
          ? `Validasi Payload Gagal: ${err.issues[0].message}`
          : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async getAttendanceToday(req: Request, res: Response) {
    try {
      const { id_pegawai } = req.query;

      if (!id_pegawai) {
        return helper.catchError(
          'Parameter id_pegawai wajib disertakan dalam query string.',
          400,
          res
        );
      }

      const tanggalHariIni = moment().tz(TIMEZONE).format('YYYY-MM-DD');
      const attendance = await repository.findAttendanceToday(
        String(id_pegawai),
        tanggalHariIni
      );

      if (!attendance) {
        return response.success(
          'Pegawai belum melakukan absensi hari ini.',
          null,
          res
        );
      }

      return response.success(SUCCESS_RETRIEVED, attendance, res);
    } catch (err: any) {
      return helper.catchError(
        `Gagal mengambil data absen hari ini: ${err?.message}`,
        500,
        res
      );
    }
  }

  // --- DATA INTERCHANGE PANEL (EXPORT / IMPORT) ---

  public async export(req: Request, res: Response) {
    try {
      const { q, template, id_pegawai, tanggal_awal, tanggal_akhir } = req.body;
      const isTemplate: boolean = template && template == '1';

      let result = await repository.listForExport({
        q,
        isTemplate,
        id_pegawai,
        tanggal_awal,
        tanggal_akhir,
      });

      const { dir, path } = await helper.checkDirExport('excel');
      const filename = `absen-harian-pegawai-${isTemplate ? 'template' : moment().tz(TIMEZONE).format('DDMMYYYY')}.xlsx`;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('LOG ABSENSI HARIAN');

      generateDataExcel(sheet, result, isTemplate);
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success(
        'export excel absen harian',
        `${dir}/${filename}`,
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `export excel absen harian: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async import(req: Request, res: Response) {
    const mode: 'preview' | 'commit' = req.body?.mode ?? 'preview';
    const uploaded = req.files?.file_import;
    if (!uploaded)
      return response.success('File tidak valid', null, res, false);

    try {
      const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      const buffer = file.tempFilePath
        ? await fs.readFile(file.tempFilePath)
        : file.data;

      const rows = await helper.parseImportFile({
        name: file.name,
        data: buffer,
      });
      const results: any[] = [];

      for (const raw of rows) {
        const row = normalizeRow(raw);
        const errors = await this.validateRow(row);

        const valid = errors.length === 0;
        const payload = {
          id_jamkerja: (row as any).id_jamkerja || null,
          id_pegawai: row.id_pegawai,
          tanggal: row.tanggal,
          waktu_masuk: row.waktu_masuk ? new Date(row.waktu_masuk) : null,
          waktu_keluar: row.waktu_keluar ? new Date(row.waktu_keluar) : null,
          keterangan_masuk: row.keterangan_masuk || '-',
          keterangan_keluar: row.keterangan_keluar || '-',
          lat_masuk: row.lat_masuk,
          long_masuk: row.long_masuk,
          lat_keluar: row.lat_keluar,
          long_keluar: row.long_keluar,
          status_kehadiran: row.status_kehadiran,
        };

        results.push({
          row: row.__row,
          valid,
          error: errors.length ? errors.join(', ') : null,
          payload,
        });
      }

      const dataRes = {
        mode,
        total: results.length,
        valid: results.filter((r) => r.valid).length,
        invalid: results.filter((r) => !r.valid).length,
      };

      if (mode === 'commit') {
        const validPayloads = results
          .filter((r) => r.valid)
          .map((r) => r.payload);
        if (validPayloads.length > 0)
          await repository.insertImport(validPayloads);
        return response.success(
          'import log absen harian berhasil',
          dataRes,
          res
        );
      }

      return response.success(
        'preview import log absen harian',
        { ...dataRes, data: results },
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `import excel log absen: ${err?.message}`,
        500,
        res
      );
    }
  }

  public insert = async (req: Request, res: Response) => {
    const payloads = req.body?.data as any[];
    if (!payloads || payloads.length === 0)
      return response.success('Data kosong', null, res, false);

    try {
      await repository.insertImport(payloads);
      return response.success(
        'Import batch data absen harian berhasil',
        { count: payloads.length },
        res
      );
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  };

  // --- STANDARD GET PANEL CRUD ---

  public async index(req: Request, res: Response) {
    try {
      const query = helper.fetchQueryRequest(req);
      const { count, rows } = await repository.index(query);
      if (rows?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(
        SUCCESS_RETRIEVED,
        { total: count, values: rows },
        res
      );
    } catch (err: any) {
      return helper.catchError(`Absen index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const result = await repository.detail({ id_absen: req.params.id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`Absen detail: ${err?.message}`, 500, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const check = await repository.detail({ id_absen: req.params.id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      await repository.delete({ id_absen: req.params.id });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `Gagal hapus log absen: ${err?.message}`,
        500,
        res
      );
    }
  }
}

export const AbsenHarianPegawaiController = new Controller();
