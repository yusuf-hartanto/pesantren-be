'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './log.gate.santri.variable';
import { response } from '../../../helpers/response';
import { repository } from './log.gate.santri.repository';
import { repository as perizinanRepo } from '../perizinan.santri/perizinan.santri.repository';
import { logGateSantriSchema } from './log.gate.santri.schema';
import moment from 'moment';
import { z } from 'zod';
import {
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import fs from 'fs/promises';
import ExcelJS from 'exceljs';

const generateDataExcel = (
  sheet: any,
  details: any,
  isTemplate: boolean = false
) => {
  // Susunan teks header dengan 2 kolom waktu berdampingan
  sheet.addRow([
    'No',
    'ID Izin (FK)',
    'Nama Santri',
    'NIS',
    'Kamar',
    'Jenis Izin',
    'Waktu Keluar',
    'Waktu Masuk',
    'Status Gate',
    'Status Kondisi',
    'Keterangan',
  ]);

  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'ID Izin (FK)', key: 'id_izin', width: 25 },
    { header: 'Nama Santri', key: 'nama_santri', width: 30 },
    { header: 'NIS', key: 'nis', width: 15 },
    { header: 'Kamar', key: 'kamar', width: 20 },
    { header: 'Jenis Izin', key: 'jenis_izin', width: 15 },
    { header: 'Waktu Keluar', key: 'waktu_keluar', width: 22 },
    { header: 'Waktu Masuk', key: 'waktu_masuk', width: 22 },
    { header: 'Status Gate', key: 'status_gate', width: 15 },
    { header: 'Status Kondisi', key: 'kondisi', width: 15 },
    { header: 'Keterangan', key: 'keterangan', width: 30 },
  ];

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  });

  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.id_izin || '',
      details[i]?.nama_santri || '',
      details[i]?.nis || '',
      details[i]?.kamar || '',
      details[i]?.jenis_izin || '',
      details[i]?.waktu_keluar ? moment(details[i].waktu_keluar).format('YYYY-MM-DD HH:mm:ss') : '-',
      details[i]?.waktu_masuk ? moment(details[i].waktu_masuk).format('YYYY-MM-DD HH:mm:ss') : '-',
      details[i]?.status_gate || '',
      details[i]?.kondisi || '',
      details[i]?.keterangan || '',
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
  id_izin: String(row['ID Izin (FK)'] || '').trim(),
  waktu_keluar: row['Waktu Keluar'] || null,
  petugas_keluar: String(row['Petugas Keluar'] || 'SYSTEM').trim(),
  waktu_masuk: row['Waktu Masuk'] || null,
  petugas_masuk: row['Petugas Masuk'] ? String(row['Petugas Masuk']).trim() : null,
  status_gate: String(row['Status Gate'] || 'Keluar').trim(),
  keterangan: row['Keterangan'] ? String(row['Keterangan']).trim() : null,
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];
  if (!row.id_izin) errors.push('ID Izin (FK) wajib diisi untuk sinkronisasi data perizinan');
  if (!row.waktu_keluar) errors.push('Waktu Keluar wajib terdefinisi');
  if (row.status_gate !== 'Keluar' && row.status_gate !== 'Kembali') {
    errors.push('Status Gate harus bernilai "Keluar" atau "Kembali"');
  }
  return errors;
};

export default class Controller {
  constructor() {
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
  }

  private async validateBusinessLogic(item: any) {
    if (item.id_izin) {
      const perizinan = await perizinanRepo.detail({ id_izin: item.id_izin });
      if (!perizinan) {
        throw new Error(`Data referensi Perizinan dengan ID [${item.id_izin}] tidak ditemukan.`);
      }
    }
    return item;
  }

  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list({});
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`LogGateSantri list: ${err?.message}`, 500, res);
    }
  }

  public async index(req: Request, res: Response) {
    try {
      const query = helper.fetchQueryRequest(req);
      
      const additionalFilters = {
        date: req.query.date ? String(req.query.date) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
      };

      const [dataPage, summary] = await Promise.all([
        repository.index({ ...query, ...additionalFilters }),
        repository.getSummary({ date: additionalFilters.date })
      ]);

      if (dataPage.rows?.length < 1)
        return response.success(NOT_FOUND, null, res, false);

      return response.success(
        SUCCESS_RETRIEVED,
        { 
          summary, 
          total: dataPage.count, 
          values: dataPage.rows 
        },
        res
      );
    } catch (err: any) {
      console.log(err)
      return helper.catchError(`LogGateSantri index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await repository.detail({ id_gate: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);

      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`LogGateSantri detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const body = req.body;
      const payloadArray = Array.isArray(body) ? body : [body];
      const validatedData = [];

      for (const item of payloadArray) {
        let validItem = logGateSantriSchema.parse(item);
        let finalItem = await this.validateBusinessLogic(validItem);

        validatedData.push(helper.only(variable.fillable(), finalItem));
      }

      await repository.create({ payload: validatedData });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      const msg =
        err instanceof z.ZodError
          ? `Validasi Gagal: ${err.issues[0].message}`
          : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const check = await repository.detail({ id_gate: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      const validData = logGateSantriSchema.partial().parse(req.body);
      const finalUpdate = await this.validateBusinessLogic({ ...check.toJSON(), ...validData });

      const payload = helper.only(variable.fillable(), finalUpdate, true);
      await repository.update({
        payload: { ...payload, updated_at: helper.date() },
        condition: { id_gate: id },
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

  public async delete(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const check = await repository.detail({ id_gate: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      await repository.delete({ id_gate: id });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`Gagal menghapus: ${err?.message}`, 500, res);
    }
  }

  public async export(req: Request, res: Response) {
    try {
      const { q, template, date, status } = req.body;
      const isTemplate: boolean = template && template == '1';

      let result = await repository.listForExport({ q, isTemplate, date, status });

      const { dir, path } = await helper.checkDirExport('excel');
      const filename = `log-gate-santri-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('DATA LOG GATE SANTRI');

      generateDataExcel(sheet, result, isTemplate);
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success(
        'export excel log gate santri',
        `${dir}/${filename}`,
        res
      );
    } catch (err: any) {
      return helper.catchError(`export excel log gate santri: ${err?.message}`, 500, res);
    }
  }

  public async import(req: Request, res: Response) {
    const mode: 'preview' | 'commit' = req.body?.mode ?? 'preview';
    const uploaded = req.files?.file_import;
    if (!uploaded)
      return response.success('File tidak valid', null, res, false);

    try {
      const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      const buffer = file.tempFilePath ? await fs.readFile(file.tempFilePath) : file.data;
      const rows = await helper.parseImportFile({ name: file.name, data: buffer });
      const results: any[] = [];

      for (const raw of rows) {
        const row = normalizeRow(raw);
        const errors = validateRow(row);

        if (row.id_izin) {
          const checkIzin = await perizinanRepo.detail({ id_izin: row.id_izin });
          if (!checkIzin) {
            errors.push(`Referensi ID Izin "${row.id_izin}" tidak ditemukan di database`);
          }
        }

        const valid = errors.length === 0;
        const payload = {
          id_izin: row.id_izin,
          waktu_keluar: row.waktu_keluar ? moment(row.waktu_keluar).format('YYYY-MM-DD HH:mm:ss') : null,
          petugas_keluar: row.petugas_keluar,
          waktu_masuk: row.waktu_masuk ? moment(row.waktu_masuk).format('YYYY-MM-DD HH:mm:ss') : null,
          petugas_masuk: row.petugas_masuk,
          status_gate: row.status_gate,
          keterangan: row.keterangan,
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
        if (validPayloads.length > 0)
          await repository.insertImport(validPayloads);
        return response.success('import log gate santri berhasil', dataRes, res);
      }

      return response.success(
        'preview import log gate santri',
        { ...dataRes, data: results },
        res
      );
    } catch (err: any) {
      return helper.catchError(`import excel log gate santri: ${err?.message}`, 500, res);
    }
  }

  public insert = async (req: Request, res: Response) => {
    const payloads = req.body?.data as any[];
    if (!payloads || payloads.length === 0)
      return response.success('Data kosong', null, res, false);

    try {
      await repository.insertImport(payloads);
      return response.success('Import batch berhasil', { count: payloads.length }, res);
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  };
}

export const LogGateSantriController = new Controller();