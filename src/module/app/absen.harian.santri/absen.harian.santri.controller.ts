'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { response } from '../../../helpers/response';
import { repository } from './absen.harian.santri.repository';
import { repository as shiftPresensiRepo } from '../shift.presensi/shift.presensi.repository';
import {
  absenHarianSantriSchema,
  bulkAbsenHarianSantriSchema,
  scanQrAbsenSchema,
} from './absen.harian.santri.schema';
import moment from 'moment';
import { any, z } from 'zod';
import {
  NOT_FOUND,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';

const generateDataExcel = (
  sheet: any,
  details: any,
  isTemplate: boolean = false
) => {
  // Susunan teks header absensi harian santri
  sheet.addRow([
    'No', // Kolom 1 (A)
    'NIS Santri', // Kolom 2 (B)
    'Nama Lengkap Santri', // Kolom 3 (C)
    'Tanggal Absen', // Kolom 4 (D)
    'Waktu Absen', // Kolom 5 (E)
    'ID Lokasi Kamar', // Kolom 6 (F)
    'Nama Kamar', // Kolom 7 (G)
    'ID Shift Presensi', // Kolom 8 (H)
    'Nama Shift', // Kolom 9 (I)
    'ID Petugas', // Kolom 10 (J) -> Dipertegas posisi kolomnya
    'Nama Petugas', // Kolom 11 (K) -> Dipertegas posisi kolomnya
    'Status Kehadiran', // Kolom 12 (L)
    'Keterangan', // Kolom 13 (M)
  ]);

  const columnWidths = [5, 18, 30, 15, 15, 40, 25, 40, 20, 40, 20, 18, 35];
  columnWidths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  // Set properti metadata kolom excel
  // sheet.columns = [
  //   { header: 'No', key: 'no', width: 5 },
  //   { header: 'NIS Santri', key: 'nis', width: 18 },
  //   { header: 'Nama Lengkap Santri', key: 'nama_lengkap', width: 30 },
  //   { header: 'Tanggal Absen', key: 'tanggal', width: 15 },
  //   { header: 'Waktu Absen', key: 'waktu_absen', width: 15 },
  //   { header: 'ID Lokasi Kamar', key: 'id_lokasi_kamar', width: 40 },
  //   { header: 'Nama Kamar', key: 'nama_kamar', width: 25 },
  //   { header: 'ID Shift Presensi', key: 'id_shift_presensi', width: 40 },
  //   { header: 'Nama Shift', key: 'nama_shift', width: 20 },
  //   { header: 'ID Petugas', key: 'id_petugas', width: 40 },
  //   { header: 'Nama Petugas', key: 'nama_petugas', width: 20 },
  //   { header: 'Status Kehadiran', key: 'status_kehadiran', width: 18 },
  //   { header: 'Keterangan', key: 'keterangan', width: 35 },
  // ];

  // Styling Header Baris Pertama
  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' },
    };
  });

  // Perulangan Data
  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1, // No
      details[i]?.santri?.nis || details[i]?.nis || '', // NIS Santri
      details[i]?.santri?.fullname || details[i]?.nama_lengkap || '', // Nama Lengkap Santri
      details[i]?.tanggal
        ? moment(details[i].tanggal).format('YYYY-MM-DD')
        : '', // Tanggal Absen
      details[i]?.waktu_absen || '', // Waktu Absen
      details[i]?.id_lokasi_kamar || '', // ID Lokasi Kamar
      details[i]?.lokasiKamar?.nama_lokasi || '', // Nama Kamar
      details[i]?.id_shift_presensi || '', // ID Shift Presensi
      details[i]?.shiftPresensi?.nama_shift || '', // Nama Shift
      details[i]?.id_petugas || '', // ID Petugas (DI SINI PERBAIKANNYA)
      details[i]?.petugas?.nama_lengkap || '', // Nama Petugas (DI SINI PERBAIKANNYA)
      details[i]?.status_kehadiran || 'Hadir', // Status Kehadiran
      details[i]?.keterangan || '', // Keterangan
    ]);
  }

  // Pemberian Border ke seluruh cell yang aktif
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

const normalizeRow = (row: any) => ({
  nis: String(row['NIS Santri'] || '').trim(),
  nama_lengkap: String(row['Nama Lengkap Santri'] || '').trim(),
  tanggal: row['Tanggal Absen'] || null,
  waktu_absen: row['Waktu Absen'] || null,
  id_lokasi_kamar: String(row['ID Lokasi Kamar'] || '').trim(),
  id_shift_presensi: String(row['ID Shift Presensi'] || '').trim(),
  id_petugas: String(row['ID Petugas'] || '').trim(),
  status_kehadiran: String(row['Status Kehadiran'] || 'Hadir').trim(),
  keterangan: String(row['Keterangan'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];
  if (!row.nis) errors.push('NIS Santri wajib diisi');
  if (!row.id_lokasi_kamar) errors.push('ID Lokasi Kamar wajib diisi');
  if (!row.id_petugas) errors.push('ID Petugas wajib diisi');

  const validStatus = ['Hadir', 'Izin', 'Sakit', 'Alfa'];
  if (!validStatus.includes(row.status_kehadiran)) {
    errors.push(
      `Status Kehadiran harus berupa salah satu dari: ${validStatus.join(', ')}`
    );
  }
  return errors;
};

export default class Controller {
  constructor() {
    // this.getSantriKamarReady = this.getSantriKamarReady.bind(this);
    this.saveKamarPresensi = this.saveKamarPresensi.bind(this);
    this.index = this.index.bind(this);
  }

  /**
   * Mengambil daftar santri aktif di kamar tertentu untuk dimuat ke dalam form absensi
   */
  public async getSantriKamarReady(req: Request, res: Response) {
    try {
      const id_lokasi_kamar = req.query.id_lokasi_kamar as string;
      const tanggal =
        (req.query.tanggal as string) || moment().format('YYYY-MM-DD');

      if (!id_lokasi_kamar) {
        return response.failed(
          'Parameter id_lokasi_kamar wajib disertakan',
          400,
          res
        );
      }

      const activePenempatan = await repository.getActiveSantriByKamar(
        id_lokasi_kamar,
        tanggal
      );

      const listSantri = activePenempatan.map((p: any) => ({
        id_santri: p.santri?.id_santri,
        fullname: p.santri?.fullname,
        nis: p.santri?.nis,
        gender: p.santri?.gender,
        id_lokasi_kamar: p.id_lokasi,
        status_kehadiran_default: 'Hadir',
      }));

      if (listSantri.length === 0) {
        return response.success(
          'Tidak ada santri aktif di kamar ini pada tanggal tersebut',
          [],
          res,
          false
        );
      }

      return response.success(SUCCESS_RETRIEVED, listSantri, res);
    } catch (err: any) {
      return helper.catchError(
        `AbsenSantri readyList: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async findAsramaShift(req: Request, res: Response) {
    try {
      const { waktu_absen } = req.query;

      if (!waktu_absen) {
        return res.status(400).json({
          status: false,
          message: 'Parameter waktu_absen wajib diisi (Format: HH:mm:ss)',
        });
      }

      let result: any = await repository.findMatchingAsramaShift(
        waktu_absen as string
      );

      let isFallbackToAll = false;

      if (!result) {
        result = await repository.findAllAsramaShift();
        isFallbackToAll = true;
      }

      return res.status(200).json({
        status: true,
        message: isFallbackToAll
          ? 'Tidak ada shift yang cocok dengan waktu tersebut. Menampilkan semua shift asrama aktif.'
          : 'Berhasil menemukan shift asrama yang cocok.',
        data: isFallbackToAll ? result : [result],
      });
    } catch (error: any) {
      console.error('Error pada findAsramaShift:', error);
      return res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan internal server',
        error: error.message,
      });
    }
  }

  /**
   * PROSES SAVE / COMMIT BULK PRESENSI KAMAR
   */
  public async saveKamarPresensi(req: Request, res: Response) {
    try {
      const validBody = bulkAbsenHarianSantriSchema.parse(req.body);

      const targetTanggal = moment(validBody.tanggal).format('YYYY-MM-DD');
      const targetWaktu = validBody.waktu_absen || moment().format('HH:mm:ss');

      const id_petugas = req.user?.id || null;

      const shiftDoc = await repository.findMatchingAsramaShift(targetWaktu);
      if (!shiftDoc) {
        return response.failed(
          `Tidak ada shift presensi kategori 'ASRAMA' yang aktif untuk rentang waktu [${targetWaktu}].`,
          422,
          res
        );
      }

      const id_shift_presensi = shiftDoc.getDataValue('id_shift');

      const validatedPayloads = [];

      for (const item of validBody.data_absen) {
        const isKamarValid = await repository.checkSantriKamarValidity(
          item.id_santri,
          validBody.id_lokasi_kamar,
          targetTanggal
        );

        if (!isKamarValid) {
          return response.failed(
            `Santri dengan ID [${item.id_santri}] tidak memiliki penempatan aktif di lokasi kamar tersebut untuk tanggal yang dipilih.`,
            422,
            res
          );
        }

        // Siapkan struktur payload database lengkap
        validatedPayloads.push({
          id_santri: item.id_santri,
          id_lokasi_kamar: validBody.id_lokasi_kamar,
          id_shift_presensi: validBody.id_shift_presensi || id_shift_presensi,
          tanggal: targetTanggal,
          waktu_absen: targetWaktu,
          status_kehadiran: item.status_kehadiran,
          keterangan: item.keterangan || null,
          id_petugas,
        });
      }

      await repository.upsertBulkAbsen(validatedPayloads);

      return response.success(
        SUCCESS_SAVED,
        {
          processed: validatedPayloads.length,
          shift_applied: shiftDoc.getDataValue('nama_shift'),
        },
        res
      );
    } catch (err: any) {
      const msg =
        err instanceof z.ZodError
          ? `Gagal Validasi Form: ${err.issues.map((i) => i.message).join(', ')}`
          : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  /**
   * Mengambil data history index absensi harian santri
   */
  public async index(req: Request, res: Response) {
    try {
      const query = helper.fetchQueryRequest(req);
      const filterData = {
        offset: query.offset,
        limit: query.limit,
        keyword: query.keyword,
      };

      const additionalFilter = {
        ...filterData,
        tanggal: req.query.tanggal,
        id_lokasi_kamar: req.query.id_lokasi_kamar,
        id_shift_presensi: req.query.id_shift_presensi,
        status: req.query.status,
      };
      const { count, rows } = await repository.index(additionalFilter);
      if (rows?.length < 1)
        return response.success(NOT_FOUND, null, res, false);

      return response.success(
        SUCCESS_RETRIEVED,
        { total: count, values: rows },
        res
      );
    } catch (err: any) {
      return helper.catchError(`AbsenSantri index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await repository.detail({ id_absen: id });

      if (!result) {
        return response.success(NOT_FOUND, null, res, false);
      }

      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`AbsenSantri detail: ${err?.message}`, 500, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id = req.params.id;

      // Cek apakah data absen yang mau di-update ada di database
      const checkAbsen = await repository.detail({ id_absen: id });
      if (!checkAbsen) {
        return response.success(NOT_FOUND, null, res, false);
      }

      // alidasi schema input menggunakan Zod secara Partial (agar field yang tidak dikirim tidak error)
      const validData = absenHarianSantriSchema.partial().parse(req.body);

      // Gabungkan data lama dengan data baru untuk keperluan validasi aturan bisnis
      const currentData = checkAbsen.toJSON() as any;
      const finalData = { ...currentData, ...validData };

      const targetTanggal = moment(finalData.tanggal).format('YYYY-MM-DD');
      const targetWaktu = finalData.waktu_absen;
      const id_petugas = req.user?.id_pegawai || currentData.id_petugas;

      // ATURAN BISNIS: Jika ada perubahan pada Santri/Kamar/Tanggal, validasi ulang penempatan kamarnya
      if (
        validData.id_santri ||
        validData.id_lokasi_kamar ||
        validData.tanggal
      ) {
        const isKamarValid = await repository.checkSantriKamarValidity(
          finalData.id_santri,
          finalData.id_lokasi_kamar,
          targetTanggal
        );

        if (!isKamarValid) {
          return response.failed(
            `Validasi Gagal: Santri tidak memiliki penempatan kamar aktif di lokasi tersebut pada tanggal ${targetTanggal}.`,
            422,
            res
          );
        }
      }

      // ATURAN BISNIS: Jika ada perubahan waktu/tanggal, hitung ulang Shift Asrama yang cocok
      let final_id_shift = currentData.id_shift_presensi;
      if (validData.waktu_absen || validData.tanggal) {
        const shiftDoc = await repository.findMatchingAsramaShift(targetWaktu);
        if (!shiftDoc) {
          return response.failed(
            `Validasi Gagal: Waktu absen [${targetWaktu}] tidak masuk dalam window shift ASRAMA manapun.`,
            422,
            res
          );
        }
        final_id_shift = shiftDoc.getDataValue('id_shift');
      }

      // Susun payload final untuk disimpan ke database
      const payload = {
        id_santri: finalData.id_santri,
        id_lokasi_kamar: finalData.id_lokasi_kamar,
        id_shift_presensi: final_id_shift,
        tanggal: targetTanggal,
        waktu_absen: targetWaktu,
        status_kehadiran: finalData.status_kehadiran,
        keterangan: finalData.keterangan,
        id_petugas,
        updated_at: helper.date(), // Timestamp update manual jika underscored & hooks membutuhkan
      };

      // Eksekusi update data ke repository
      await repository.update({
        payload,
        condition: { id_absen: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      const msg =
        err instanceof z.ZodError
          ? `Update Gagal: ${err.issues[0].message}`
          : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async scanQrPresensi(req: Request, res: Response) {
    try {
      const validBody = scanQrAbsenSchema.parse(req.body);

      const targetTanggal =
        validBody.tanggal_custom || moment().format('YYYY-MM-DD');
      const targetWaktu = validBody.waktu_custom || moment().format('HH:mm:ss');
      const id_petugas = req.user?.id || null;

      let shiftDoc: any = null;
      let id_shift_presensi = validBody.id_shift_presensi || null;

      // Tentukan Shift Presensi ASRAMA yang sedang berjalan berdasarkan waktu scan saat ini
      shiftDoc = await repository.findMatchingAsramaShift(targetWaktu);

      // Fallback: Jika tidak ditemukan berdasarkan kecocokan waktu, gunakan id_shift_presensi dari payload
      if (!shiftDoc && id_shift_presensi) {
        shiftDoc = await shiftPresensiRepo.detail({
          id_shift: id_shift_presensi,
        });
      }

      // Jika setelah dilakukan fallback tetap tidak ditemukan dokumen master shift yang valid
      if (!shiftDoc) {
        return response.failed(
          `Gagal Scan: Waktu saat ini [${targetWaktu}] tidak masuk dalam window shift ASRAMA manapun yang aktif.`,
          422,
          res
        );
      }

      // Ambil ID Shift murni dari hasil pencarian database
      id_shift_presensi = shiftDoc.getDataValue('id_shift');

      // Mencari data santri aktif berdasar NIS, Tanggal Hari Ini, dan Lokasi Kamar secara ketat (REQUIRED / INNER JOIN)
      const santriKamar: any = await repository.findSantriAndRoomByNis(
        validBody.nis,
        targetTanggal,
        validBody.id_lokasi
      );

      // Mengambil baris pertama data penempatan kamar santri
      const penempatanAktif = santriKamar?.penempatanKamar?.[0];

      // Jalankan single guard clause yang efisien. Jika santri tidak ada / kamar tidak cocok, auto return gagal
      if (!santriKamar || !penempatanAktif) {
        return response.failed(
          `Gagal Scan: Santri dengan [${validBody.nis}] tidak ditemukan atau tidak terdaftar di lokasi kamar aktif ini.`,
          422,
          res
        );
      }

      const idLokasiSantri = penempatanAktif.id_lokasi;

      // ========================================================
      // KONDISI TAMBAHAN: CEK JIKA SUDAH MELAKUKAN PRESENSI
      // ========================================================
      const existingAbsen = await repository.checkExistingAbsen({
        id_santri: santriKamar.id_santri,
        tanggal: targetTanggal,
        id_shift_presensi: id_shift_presensi,
      });

      if (existingAbsen) {
        return response.failed(
          `Gagal Scan: Santri [${santriKamar.fullname}] sudah melakukan presensi untuk shift ${shiftDoc.getDataValue('nama_shift')} hari ini.`,
          422,
          res
        );
      }

      // ========================================================
      // LOGIKA VALIDASI BATAS TOLERANSI KETERLAMBATAN WAKTU SHIFT
      // ========================================================
      let status_kehadiran = 'Hadir';
      let keterangan = 'Hadir via Pindai QR Code';

      // Mengambil property batas toleransi (biasanya field 'waktu_akhir' atau 'batas_toleransi' di DB)
      const batasToleransi =
        shiftDoc.getDataValue('batas_toleransi') ||
        shiftDoc.getDataValue('waktu_akhir');

      if (batasToleransi) {
        const formatWaktu = 'HH:mm:ss';
        const waktuScanMoment = moment(targetWaktu, formatWaktu);
        const batasMoment = moment(batasToleransi, formatWaktu);

        // Jika waktu scan santri ternyata melewati batas toleransi yang ditentukan pada master shift
        if (waktuScanMoment.isAfter(batasMoment)) {
          status_kehadiran = 'Alfa';
          keterangan = 'Tidak hadir, waktu scan melewati batas toleransi';
        }
      }

      // Susun susunan Payload terstruktur untuk di-Upsert otomatis ke database log presensi
      const payload = {
        id_santri: santriKamar.id_santri,
        id_lokasi_kamar: idLokasiSantri,
        id_shift_presensi,
        tanggal: targetTanggal,
        waktu_absen: targetWaktu,
        status_kehadiran,
        keterangan,
        id_petugas,
      };

      // Jalankan eksekusi Upsert data ke Database Log Presensi
      await repository.upsertSingleAbsen(payload);

      // Berikan data response sukses balik yang informatif untuk dipajang di layar monitor frontend scanner
      return response.success(
        status_kehadiran === 'Alfa'
          ? 'Presensi dicatat Terlambat (Alfa)!'
          : 'Presensi berhasil dicatat!',
        {
          nis: santriKamar.nis,
          nama_lengkap: santriKamar.fullname,
          waktu_scan: targetWaktu,
          shift: shiftDoc.getDataValue('nama_shift'),
          status_kehadiran,
          keterangan,
        },
        res
      );
    } catch (err: any) {
      console.log(err);
      // Penanganan error runtime atau kegagalan parsing skema Zod
      const msg =
        err instanceof z.ZodError
          ? `Scan Gagal: ${err.issues[0].message}`
          : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async export(req: Request, res: Response) {
    try {
      const {
        q,
        template,
        id_lokasi_kamar,
        id_shift_presensi,
        status,
        tanggal,
      } = req.body;
      const isTemplate: boolean = template && template == '1';

      let result = await repository.listForExport({
        q,
        isTemplate,
        id_lokasi_kamar,
        id_shift_presensi,
        status,
        tanggal,
      });

      const { dir, path } = await helper.checkDirExport('excel');
      const filename = `absen-santri-${isTemplate ? 'template-' + moment().format('HHmmss') : moment().format('DDMMYYYY-HHmmss')}.xlsx`;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('ABSEN HARIAN SANTRI');

      generateDataExcel(sheet, result, isTemplate);
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success(
        'export excel absensi santri',
        `${dir}/${filename}`,
        res
      );
    } catch (err: any) {
      console.log(err);
      return helper.catchError(
        `export excel absensi santri: ${err?.message}`,
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

      const id_petugas = req.user?.id || null;

      for (const raw of rows) {
        const row = normalizeRow(raw);
        const errors = validateRow(row);

        let id_santri = null;
        let fullname_santri = '-'; // Default jika data santri tidak ditemukan
        let final_id_shift = row.id_shift_presensi;
        const targetTanggal = row.tanggal
          ? moment(row.tanggal).format('YYYY-MM-DD')
          : moment().format('YYYY-MM-DD');
        const targetWaktu = row.waktu_absen || moment().format('HH:mm:ss');

        // Resolve ID & Nama Santri berdasarkan NIS
        const santriDoc: any = await repository.findSantriByNisOnly(row.nis);
        if (santriDoc) {
          id_santri = santriDoc.id_santri;
          fullname_santri = santriDoc.fullname || santriDoc.nama_lengkap; // Ambil properti nama dari model DB Anda
        } else {
          errors.push(`Santri dengan NIS "${row.nis}" tidak ditemukan`);
        }

        // Validasi Aturan Kamar Aktif Santri di tanggal tersebut
        if (id_santri && row.id_lokasi_kamar) {
          const isKamarValid = await repository.checkSantriKamarValidity(
            id_santri,
            row.id_lokasi_kamar,
            targetTanggal
          );
          if (!isKamarValid) {
            errors.push(
              `Santri tidak memiliki penempatan aktif di lokasi kamar tersebut untuk tanggal yang dipilih`
            );
          }
        }

        // Resolve Shift Otomatis jika kolom ID Shift di Excel kosong
        if (
          !final_id_shift ||
          final_id_shift === 'undefined' ||
          final_id_shift === ''
        ) {
          const autoShift =
            await repository.findMatchingAsramaShift(targetWaktu);
          if (autoShift) {
            final_id_shift = autoShift.getDataValue('id_shift');
          } else {
            errors.push(
              `Tidak ada shift ASRAMA aktif yang memayungi waktu [${targetWaktu}]`
            );
          }
        }

        const valid = errors.length === 0;

        // Payload murni yang nantinya dilempar ke database saat commit
        const payload = {
          id_santri,
          id_lokasi_kamar: row.id_lokasi_kamar,
          id_shift_presensi: final_id_shift,
          tanggal: targetTanggal,
          waktu_absen: targetWaktu,
          status_kehadiran: row.status_kehadiran,
          keterangan: row.keterangan || 'Import Excel',
          id_petugas: row.id_petugas || id_petugas,

          // Ditambahkan di payload agar bisa dibaca langsung di mapping baris frontend
          nis: row.nis,
          fullname: fullname_santri,
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
          .map((r) => {
            // Bersihkan metadata frontend (nis & fullname) jika query bulkinsert database Anda menolak kolom luar
            const { nis, fullname, ...purePayload } = r.payload;
            return purePayload;
          });

        if (validPayloads.length > 0) {
          await repository.upsertBulkAbsen(validPayloads);
        }
        return response.success('import absensi santri berhasil', dataRes, res);
      }

      return response.success(
        'preview import absensi santri',
        { ...dataRes, data: results },
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `import excel absensi santri: ${err?.message}`,
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
      await repository.upsertBulkAbsen(payloads);
      return response.success(
        'Import batch berhasil',
        { count: payloads.length },
        res
      );
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  };
}

export const AbsenHarianSantriController = new Controller();
