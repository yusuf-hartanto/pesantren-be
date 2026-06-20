'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { response } from '../../../helpers/response';
import { repository } from './pegawai.jam.kerja.repository';
import { repository as pegawaiRepo } from '../pegawai/pegawai.repository';
import { repository as lokasiRepo } from '../location/location.repository';
import { jamKerjaPegawaiSchema } from './pegawai.jam.kerja.schema';
import { z } from 'zod';
import moment from 'moment';
import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import {
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';

const generateDataExcel = (
  sheet: any,
  details: any,
  isTemplate: boolean = false
) => {
  // Susunan Header kolom
  sheet.addRow([
    'No',
    'ID Pegawai',
    'Nama Pegawai',
    'ID Lokasi Kerja',
    'Nama Lokasi Kerja',
    'Waktu Mulai',
    'Waktu Selesai',
    'Keterangan',
    'Status Aktif (1/0)',
  ]);

  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'ID Pegawai', key: 'id_pegawai', width: 25 },
    { header: 'Nama Pegawai', key: 'nama_pegawai', width: 30 },
    { header: 'ID Lokasi Kerja', key: 'id_lokasi', width: 25 },
    { header: 'Nama Lokasi Kerja', key: 'nama_lokasi', width: 25 },
    { header: 'Waktu Mulai', key: 'waktu_mulai', width: 15 },
    { header: 'Waktu Selesai', key: 'waktu_selesai', width: 15 },
    { header: 'Keterangan', key: 'keterangan', width: 40 },
    { header: 'Status Aktif (1/0)', key: 'is_active', width: 18 },
  ];

  // Styling Header
  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Isi Data
  for (let i in details) {
    const rowData = details[i];
    
    // Agar kolom waktu kompatibel penuh saat diimport kembali oleh ExcelJS,
    // kita paksa formatnya berupa Text string jam murni (HH:mm:ss)
    const tMulai = rowData?.waktu_mulai ? String(rowData.waktu_mulai).trim() : '00:00:00';
    const tSelesai = rowData?.waktu_selesai ? String(rowData.waktu_selesai).trim() : '00:00:00';

    sheet.addRow([
      parseInt(i) + 1,
      rowData?.id_pegawai || '',
      rowData?.pegawai?.nama_lengkap || '',
      rowData?.id_lokasi || '',
      rowData?.lokasiKerja?.nama_lokasi || '',
      tMulai,
      tSelesai,
      rowData?.keterangan || '',
      rowData?.is_active ? '1' : '0',
    ]);

    // Berikan format text eksplisit ke cell waktu agar cell Excel tidak otomatis berasumsi jadi format date/number acak
    const currentRowNum = parseInt(i) + 2;
    sheet.getCell(`F${currentRowNum}`).numFmt = '@';
    sheet.getCell(`G${currentRowNum}`).numFmt = '@';
  }

  // Set Border untuk semua cell aktif
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
  // Fungsi pembantu mengekstrak format waktu jika terbaca sebagai objek Date atau teks utuh oleh parser excel
  const parseTimeStr = (val: any) => {
    if (!val) return '00:00:00';
    const sVal = String(val).trim();
    if (sVal.includes(':')) {
      // Jika format sudah HH:mm atau HH:mm:ss, ambil segment utamanya
      return sVal.split(' ')[0]; 
    }
    if (moment(val, 'HH:mm:ss', true).isValid()) return sVal;
    // Jaga-jaga jika excel membaca raw cell time menjadi representasi ISO Date string lengkap
    if (moment(val).isValid()) return moment(val).format('HH:mm:ss');
    return sVal;
  };

  return {
    id_pegawai: String(row['ID Pegawai'] || '').trim(),
    nama_pegawai: String(row['Nama Pegawai'] || '').trim(),
    id_lokasi: String(row['ID Lokasi Kerja'] || '').trim(),
    nama_lokasi: String(row['Nama Lokasi Kerja'] || '').trim(),
    waktu_mulai: parseTimeStr(row['Waktu Mulai']),
    waktu_selesai: parseTimeStr(row['Waktu Selesai']),
    keterangan: String(row['Keterangan'] || '').trim(),
    is_active: String(row['Status Aktif (1/0)'] || '').trim() === '1',
    __row: row.__row,
  };
};

export default class Controller {
  constructor() {
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.import = this.import.bind(this);
  }

  private async validateBusinessLogic(item: any, id_jamkerja?: string) {
    const pegawai = await pegawaiRepo.detail({ id_pegawai: item.id_pegawai });
    if (!pegawai) throw new Error(`Pegawai ID [${item.id_pegawai}] tidak ditemukan.`);

    const lokasi = await lokasiRepo.detail({ id_lokasi: item.id_lokasi });
    if (!lokasi) throw new Error(`Lokasi Kerja ID [${item.id_lokasi}] tidak ditemukan.`);

    const checkDuplicatePegawai = await repository.checkDuplicatePegawai(item.id_pegawai, id_jamkerja);
    if (checkDuplicatePegawai) {
      throw new Error(`Pegawai [${pegawai.nama_lengkap}] sudah memiliki acuan master jam kerja.`);
    }

    return item;
  }

  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list({});
      if (result?.length < 1) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`JamKerjaPegawai list: ${err?.message}`, 500, res);
    }
  }

  public async index(req: Request, res: Response) {
    try {
      const query = helper.fetchQueryRequest(req);
      const { count, rows } = await repository.index(query);
      if (rows?.length < 1) return response.success(NOT_FOUND, null, res, false);

      return response.success(SUCCESS_RETRIEVED, { total: count, values: rows }, res);
    } catch (err: any) {
      return helper.catchError(`JamKerjaPegawai index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await repository.detail({ id_jamkerja: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);

      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`JamKerjaPegawai detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const body = req.body;
      const payloadArray = Array.isArray(body) ? body : [body];
      const validatedData = [];

      for (const item of payloadArray) {
        let validItem = jamKerjaPegawaiSchema.parse(item);
        let finalItem = await this.validateBusinessLogic(validItem);
        validatedData.push(finalItem);
      }

      await repository.create(validatedData);
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      const msg = err instanceof z.ZodError ? `Validasi Gagal: ${err.issues[0].message}` : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const check = await repository.detail({ id_jamkerja: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      const validData = jamKerjaPegawaiSchema.partial().parse(req.body);
      const finalUpdate = await this.validateBusinessLogic({ ...check.toJSON(), ...validData }, id);

      await repository.update({
        payload: {
          id_pegawai: finalUpdate.id_pegawai,
          id_lokasi: finalUpdate.id_lokasi,
          waktu_mulai: finalUpdate.waktu_mulai,
          waktu_selesai: finalUpdate.waktu_selesai,
          keterangan: finalUpdate.keterangan,
          is_active: finalUpdate.is_active,
          updated_at: helper.date()
        },
        condition: { id_jamkerja: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      const msg = err instanceof z.ZodError ? `Update Gagal: ${err.issues[0].message}` : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const check = await repository.detail({ id_jamkerja: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      await repository.delete({ id_jamkerja: id });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`Gagal menghapus: ${err?.message}`, 500, res);
    }
  }

  public async export(req: Request, res: Response) {
    try {
      const { q, template } = req.body;
      const isTemplate: boolean = template && template == '1';

      // Ambil data acuan master jam kerja dari db repo
      let result = await repository.listForExport({ q, isTemplate });

      const { dir, path } = await helper.checkDirExport('excel');
      const filename = `jam-kerja-pegawai-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('MASTER JAM KERJA');

      generateDataExcel(sheet, result, isTemplate);
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success('export excel jam kerja', `${dir}/${filename}`, res);
    } catch (err: any) {
      return helper.catchError(`export excel jam kerja: ${err?.message}`, 500, res);
    }
  }

  public async import(req: Request, res: Response) {
    const mode: 'preview' | 'commit' = req.body?.mode ?? 'preview';
    const uploaded = req.files?.file_import;
    if (!uploaded) return response.success('File tidak valid', null, res, false);

    try {
      const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      const buffer = file.tempFilePath ? await fs.readFile(file.tempFilePath) : file.data;
      
      const rows = await helper.parseImportFile({ name: file.name, data: buffer });
      const results: any[] = [];

      for (const raw of rows) {
        const row = normalizeRow(raw);
        const errors: string[] = [];

        // Validasi Eksistensi Kunci
        if (!row.id_pegawai) errors.push('ID Pegawai wajib diisi');
        if (!row.id_lokasi) errors.push('ID Lokasi Kerja wajib diisi');
        if (!row.waktu_mulai) errors.push('Waktu mulai wajib diisi');
        if (!row.waktu_selesai) errors.push('Waktu selesai wajib diisi');

        // Validasi Validitas Relasi ke DB jika data input awal lengkap
        if (row.id_pegawai) {
          const peg = await pegawaiRepo.detail({ id_pegawai: row.id_pegawai });
          if (!peg) errors.push(`Pegawai dengan ID "${row.id_pegawai}" tidak ditemukan`);
        }
        if (row.id_lokasi) {
          const lok = await lokasiRepo.detail({ id_lokasi: row.id_lokasi });
          if (!lok) errors.push(`Lokasi dengan ID "${row.id_lokasi}" tidak ditemukan`);
        }

        const valid = errors.length === 0;
        const payload = {
          id_pegawai: row.id_pegawai,
          id_lokasi: row.id_lokasi,
          waktu_mulai: row.waktu_mulai,
          waktu_selesai: row.waktu_selesai,
          keterangan: row.keterangan || '-',
          is_active: row.is_active,
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
        const validPayloads = results.filter((r) => r.valid).map((r) => r.payload);
        if (validPayloads.length > 0) await repository.insertImport(validPayloads);
        return response.success('import master jam kerja berhasil', dataRes, res);
      }

      return response.success('preview import master jam kerja', { ...dataRes, data: results }, res);
    } catch (err: any) {
      return helper.catchError(`import excel jam kerja: ${err?.message}`, 500, res);
    }
  }

  public insert = async (req: Request, res: Response) => {
    const payloads = req.body?.data as any[];
    if (!payloads || payloads.length === 0) return response.success('Data kosong', null, res, false);

    try {
      await repository.insertImport(payloads);
      return response.success('Import batch berhasil', { count: payloads.length }, res);
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  };
}

export const JamKerjaPegawai = new Controller();