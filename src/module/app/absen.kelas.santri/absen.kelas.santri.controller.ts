'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { response } from '../../../helpers/response';
import { repository } from './absen.kelas.santri.repository';
import { repository as repoJamPelajaran } from '../jam.pelajaran/jam.pelajaran.repository';
import {
  absenKelasSantriSchema,
  bulkAbsenKelasSantriSchema,
  scanQrAbsenSchema,
} from './absen.kelas.santri.schema';
import moment from 'moment';
import { z } from 'zod';
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
  sheet.addRow([
    'No', // Kolom 1 (A)
    'NIS Santri', // Kolom 2 (B)
    'Nama Lengkap Santri', // Kolom 3 (C)
    'Tanggal Absen', // Kolom 4 (D)
    'Waktu Absen', // Kolom 5 (E)
    'ID Lokasi', // Kolom 6 (F)
    'Nama Lokasi', // Kolom 7 (G)
    'ID Jam Pelajaran', // Kolom 8 (H)
    'Nama Jam Pelajaran', // Kolom 9 (I)
    'ID Petugas', // Kolom 10 (J) -> Dipertegas posisi kolomnya
    'Nama Petugas', // Kolom 11 (K) -> Dipertegas posisi kolomnya
    'Status Kehadiran', // Kolom 12 (L)
    'Keterangan', // Kolom 13 (M)
  ]);

  const columnWidths = [5, 18, 30, 15, 15, 40, 25, 40, 20, 40, 20, 18, 35];
  columnWidths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' },
    };
  });

  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1, // No
      details[i]?.santri?.nis || details[i]?.nis || '', // NIS Santri
      details[i]?.santri?.fullname || details[i]?.nama_lengkap || '', // Nama Lengkap Santri
      details[i]?.tanggal
        ? moment(details[i].tanggal).format('YYYY-MM-DD')
        : '', // Tanggal Absen
      details[i]?.waktu_absen || '', // Waktu Absen
      details[i]?.id_lokasi || '', // ID Lokasi
      details[i]?.lokasi?.nama_lokasi || '', // Nama Lokasi
      details[i]?.id_jam_pelajaran || '', // ID Jam Pelajaran
      details[i]?.jamPelajaran?.nama_pelajaran || '', // Nama Jam Pelajaran
      details[i]?.id_petugas || '', // ID Petugas
      details[i]?.petugas?.nama_lengkap || '', // Nama Petugas
      details[i]?.status_kehadiran || 'Hadir', // Status Kehadiran
      details[i]?.keterangan || '', // Keterangan
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

const normalizeRow = (row: any) => ({
  nis: String(row['NIS Santri'] || '').trim(),
  nama_lengkap: String(row['Nama Lengkap Santri'] || '').trim(),
  tanggal: row['Tanggal Absen'] || null,
  waktu_absen: row['Waktu Absen'] || null,
  id_lokasi: String(row['ID Lokasi'] || '').trim(),
  id_jam_pelajaran: String(row['ID Jam Pelajaran'] || '').trim(),
  id_petugas: String(row['ID Petugas'] || '').trim(),
  status_kehadiran: String(row['Status Kehadiran'] || 'Hadir').trim(),
  keterangan: String(row['Keterangan'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];
  if (!row.nis) errors.push('NIS Santri wajib diisi');
  if (!row.id_lokasi) errors.push('ID Lokasi wajib diisi');
  if (!row.id_jam_pelajaran) errors.push('ID Jam Pelajaran wajib diisi');
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
    this.saveKelasPresensi = this.saveKelasPresensi.bind(this);
    this.index = this.index.bind(this);
  }

  public async findJamPelajaran(req: Request, res: Response) {
    try {
      const { waktu_absen } = req.query;

      if (!waktu_absen) {
        return res.status(400).json({
          status: false,
          message: 'Parameter waktu_absen wajib diisi (Format: HH:mm:ss)',
        });
      }

      let result: any = await repository.findMatchingJamPelajaran(
        waktu_absen as string
      );

      let isFallbackToAll = false;

      if (!result) {
        result = await repository.findAllJamPelajaran();
        isFallbackToAll = true;
      }

      return res.status(200).json({
        status: true,
        message: isFallbackToAll
          ? 'Tidak ada jam pelajaran yang cocok dengan waktu tersebut. Menampilkan semua jam pelajaran aktif.'
          : 'Berhasil menemukan jam pelajaran yang cocok.',
        data: isFallbackToAll ? result : [result],
      });
    } catch (error: any) {
      console.error('Error pada findJamPelajaran:', error);
      return res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan internal server',
        error: error.message,
      });
    }
  }

  public async findSantriCabang(req: Request, res: Response) {
    try {
      const { id_cabang, id_lokasi } = req.query;

      if (!id_cabang && !id_lokasi) {
        return res.status(400).json({
          status: false,
          message: 'Parameter id_cabang atau id_lokasi wajib diisi',
        });
      }

      let result: any = await repository.findSantriByCabang(id_cabang as string, id_lokasi as string);

      return res.status(200).json({
        status: true,
        message: 'Berhasil menemukan santri',
        data: result,
      });
    } catch (error: any) {
      console.error('Error pada findSantriCabang:', error);
      return res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan internal server',
        error: error.message,
      });
    }
  }

  public async saveKelasPresensi(req: Request, res: Response) {
    try {
      const validBody = bulkAbsenKelasSantriSchema.parse(req.body);

      const targetTanggal = moment(validBody.tanggal).format('YYYY-MM-DD');
      const targetWaktu = validBody.waktu_absen || moment().format('HH:mm:ss');

      const id_petugas = req.user?.id || null;

      const jamPelajaran = await repository.findMatchingJamPelajaran(targetWaktu);
      if (!jamPelajaran) {
        return response.failed(
          `Tidak ada jam pelajaran yang aktif untuk rentang waktu [${targetWaktu}].`,
          422,
          res
        );
      }

      const id_jam_pelajaran = jamPelajaran.getDataValue('id_jampel');
      const validatedPayloads = [];

      for (const item of validBody.data_absen) {
        validatedPayloads.push({
          id_santri: item.id_santri,
          id_lokasi: validBody.id_lokasi,
          id_jam_pelajaran: validBody.id_jam_pelajaran || id_jam_pelajaran,
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
          jampel_applied: jamPelajaran.getDataValue('nama_jampel'),
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
        id_lokasi: req.query.id_lokasi,
        id_jam_pelajaran: req.query.id_jam_pelajaran,
        status: req.query.status,
        tanggal_awal: req.query.tanggal_awal,
        tanggal_akhir: req.query.tanggal_akhir,
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
      return helper.catchError(`AbsenKelasSantri index: ${err?.message}`, 500, res);
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
      return helper.catchError(`AbsenKelasSantri detail: ${err?.message}`, 500, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id = req.params.id;

      const checkAbsen = await repository.detail({ id_absen: id });
      if (!checkAbsen) {
        return response.success(NOT_FOUND, null, res, false);
      }

      const validData = absenKelasSantriSchema.partial().parse(req.body);

      const currentData = checkAbsen.toJSON() as any;
      const finalData = { ...currentData, ...validData };

      const targetTanggal = moment(finalData.tanggal).format('YYYY-MM-DD');
      const targetWaktu = finalData.waktu_absen;
      const id_petugas = req.user?.id || currentData.id_petugas;

      let final_id_jampel = currentData.id_jam_pelajaran;
      if (validData.waktu_absen || validData.tanggal) {
        const jamPelajaran = await repository.findMatchingJamPelajaran(targetWaktu);
        if (!jamPelajaran) {
          return response.failed(
            `Validasi Gagal: Waktu absen [${targetWaktu}] tidak masuk dalam window jam pelajaran manapun.`,
            422,
            res
          );
        }
        final_id_jampel = jamPelajaran.getDataValue('id_jampel');
      }

      const payload = {
        id_santri: finalData.id_santri,
        id_lokasi: finalData.id_lokasi,
        id_jam_pelajaran: final_id_jampel,
        tanggal: targetTanggal,
        waktu_absen: targetWaktu,
        status_kehadiran: finalData.status_kehadiran,
        keterangan: finalData.keterangan,
        id_petugas,
        updated_at: helper.date(),
      };

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

      let jamPelajaran: any = null;
      let id_jam_pelajaran = validBody.id_jam_pelajaran || null;

      jamPelajaran = await repository.findMatchingJamPelajaran(targetWaktu);
      if (!jamPelajaran && id_jam_pelajaran) {
        jamPelajaran = await repoJamPelajaran.detail({
          id_jampel: id_jam_pelajaran,
        });
      }

      if (!jamPelajaran) {
        return response.failed(
          `Gagal Scan: Waktu saat ini [${targetWaktu}] tidak masuk dalam window jam pelajaran manapun yang aktif.`,
          422,
          res
        );
      }
      id_jam_pelajaran = jamPelajaran.getDataValue('id_jampel');

      const santri = await repository.findSantriByNis(validBody.nis);
      if (!santri) {
        return response.failed(
          `Gagal Scan: Santri NIS [${validBody.nis}] tidak ditemukan.`,
          422,
          res
        );
      }

      // ========================================================
      // KONDISI TAMBAHAN: CEK JIKA SUDAH MELAKUKAN PRESENSI
      // ========================================================
      const existingAbsen = await repository.checkExistingAbsen({
        id_santri: santri.getDataValue('id_santri'),
        tanggal: targetTanggal,
        id_jam_pelajaran,
      });

      if (existingAbsen) {
        return response.failed(
          `Gagal Scan: Santri [${santri.getDataValue('fullname')}] sudah melakukan presensi untuk jam pelajaran ${jamPelajaran.getDataValue('nama_jampel')} hari ini.`,
          422,
          res
        );
      }

      // ========================================================
      // LOGIKA VALIDASI BATAS TOLERANSI KETERLAMBATAN WAKTU
      // ========================================================
      let status_kehadiran = 'Hadir';
      let keterangan = 'Hadir via Pindai QR Code';

      const batasToleransi = jamPelajaran.getDataValue('selesai');
      if (batasToleransi) {
        const formatWaktu = 'HH:mm:ss';
        const waktuScanMoment = moment(targetWaktu, formatWaktu);
        const batasMoment = moment(batasToleransi, formatWaktu);

        if (waktuScanMoment.isAfter(batasMoment)) {
          status_kehadiran = 'Alfa';
          keterangan = 'Tidak hadir, waktu scan melewati batas toleransi';
        }
      }

      const payload = {
        id_santri: santri.getDataValue('id_santri'),
        id_lokasi: validBody.id_lokasi,
        id_jam_pelajaran,
        tanggal: targetTanggal,
        waktu_absen: targetWaktu,
        status_kehadiran,
        keterangan,
        id_petugas,
      };

      await repository.upsertSingleAbsen(payload);

      return response.success(
        status_kehadiran === 'Alfa'
          ? 'Presensi dicatat Terlambat (Alfa)!'
          : 'Presensi berhasil dicatat!',
        {
          nis: santri.getDataValue('nis'),
          nama_lengkap: santri.getDataValue('fullname'),
          waktu_scan: targetWaktu,
          jampel: jamPelajaran.getDataValue('nama_jampel'),
          status_kehadiran,
          keterangan,
        },
        res
      );
    } catch (err: any) {
      console.log(err);
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
        id_lokasi,
        id_jam_pelajaran,
        status,
        tanggal,
        tanggal_awal,
        tanggal_akhir,
      } = req.body;
      const isTemplate: boolean = template && template == '1';

      let result = await repository.listForExport({
        q,
        isTemplate,
        id_lokasi,
        id_jam_pelajaran,
        status,
        tanggal,
        tanggal_awal,
        tanggal_akhir,
      });

      const { dir, path } = await helper.checkDirExport('excel');
      const filename = `absen-kelas-santri-${isTemplate ? 'template-' + moment().format('HHmmss') : moment().format('DDMMYYYY-HHmmss')}.xlsx`;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('ABSEN KELAS SANTRI');

      generateDataExcel(sheet, result, isTemplate);
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success(
        'export excel absensi kelas santri',
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
        let fullname_santri = '-';
        let final_id_jampel = row.id_jam_pelajaran;
        const targetTanggal = row.tanggal
          ? moment(row.tanggal).format('YYYY-MM-DD')
          : moment().format('YYYY-MM-DD');
        const targetWaktu = row.waktu_absen || moment().format('HH:mm:ss');

        const santriDoc: any = await repository.findSantriByNisOnly(row.nis);
        if (santriDoc) {
          id_santri = santriDoc.getDataValue('id_santri');
          fullname_santri = santriDoc.getDataValue('fullname') || '-';
        } else {
          errors.push(`Santri dengan NIS "${row.nis}" tidak ditemukan`);
        }

        if (
          !final_id_jampel ||
          final_id_jampel === 'undefined' ||
          final_id_jampel === ''
        ) {
          const autoJamPel =
            await repository.findMatchingJamPelajaran(targetWaktu);
          if (autoJamPel) {
            final_id_jampel = autoJamPel.getDataValue('id_jampel');
          } else {
            errors.push(
              `Tidak ada jam pelajaran aktif yang memayungi waktu [${targetWaktu}]`
            );
          }
        }

        const valid = errors.length === 0;

        const payload = {
          id_santri,
          id_lokasi: row.id_lokasi,
          id_jam_pelajaran: final_id_jampel,
          tanggal: targetTanggal,
          waktu_absen: targetWaktu,
          status_kehadiran: row.status_kehadiran,
          keterangan: row.keterangan || 'Import Excel',
          id_petugas: row.id_petugas || id_petugas,

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
            const { nis, fullname, ...purePayload } = r.payload;
            return purePayload;
          });

        if (validPayloads.length > 0) {
          await repository.upsertBulkAbsen(validPayloads);
        }
        return response.success('import absensi kelas santri berhasil', dataRes, res);
      }

      return response.success(
        'preview import absensi kelas santri',
        { ...dataRes, data: results },
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `import excel absensi kelas santri: ${err?.message}`,
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

export const AbsenKelasSantriController = new Controller();
