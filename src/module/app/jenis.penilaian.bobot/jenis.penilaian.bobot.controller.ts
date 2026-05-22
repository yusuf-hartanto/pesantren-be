'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './jenis.penilaian.bobot.variable';
import { response } from '../../../helpers/response';
import { repository } from './jenis.penilaian.bobot.repository';
import { repository as penilaianRepo } from '../jenis.penilaian/jenis.penilaian.repository';
import { repository as formalRepo } from '../lembaga.pendidikan.formal/lembaga.pendidikan.formal.repository';
import { repository as pesantrenRepo } from '../lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.repository';
import { repository as tingkatRepo } from '../tingkat/tingkat.repository';
import { repository as tahunRepo } from '../tahun.ajaran/tahun.ajaran.repository';

import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import { updateExistingBobot, validateBobot } from './validation';
import { bobotSchema } from './jenis.penilaian.bobot.schema';
import moment from 'moment';
import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import { Op } from 'sequelize';
import z from 'zod';

const date: string = helper.date();

const generateDataExcel = (
  sheet: any,
  details: any,
  isTemplate: boolean = false
) => {
  // Susunan teks header persis di baris pertama
  sheet.addRow([
    'No',
    'Jenis Penilaian',
    'Tipe Lembaga',
    'Lembaga',
    'Tingkat',
    'Tahun Ajaran',
    'Bobot (%)',
    'Status',
  ]);

  // Set property metadata kolom
  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Jenis Penilaian', key: 'penilaian', width: 25 },
    { header: 'Tipe Lembaga', key: 'lembaga_type', width: 15 },
    { header: 'Lembaga', key: 'nama_lembaga', width: 30 },
    { header: 'Tingkat', key: 'tingkat', width: 15 },
    { header: 'Tahun Ajaran', key: 'ta', width: 15 },
    { header: 'Bobot (%)', key: 'bobot', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  // Styling Header Baris Pertama
  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Perulangan Data menggunakan gaya indeks array (for...in) & Logika IsTemplate (ID vs Nama)
  for (let i in details) {
    const item = details[i];

    // Ambil data relasi lembaga (Pola formal / pesantren)
    const namaLembagaReal =
      item.lembagaPendidikanFormal?.nama_lembaga ||
      item.lembagaPendidikanKepesantrenan?.nama_lembaga ||
      '';

    sheet.addRow([
      parseInt(i) + 1,
      isTemplate
        ? item.id_penilaian
        : item.jenisPenilaian?.jenis_pengujian || '',
      item.lembaga_type || '',
      isTemplate ? item.id_lembaga : namaLembagaReal,
      isTemplate ? item.id_tingkat : item.tingkat?.tingkat || '',
      isTemplate ? item.id_tahunajaran : item.tahunAjaran?.tahun_ajaran || '',
      item.bobot || 0,
      item.status || 'Aktif',
    ]);
  }

  // Pemberian Border secara paksa ke seluruh cell yang aktif
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
  id_penilaian: String(row['Jenis Penilaian'] || '').trim(),
  lembaga_type: String(row['Tipe Lembaga'] || '')
    .toUpperCase()
    .trim(),
  id_lembaga: String(row['Lembaga'] || '').trim(),
  id_tingkat: String(row['Tingkat'] || '').trim(),
  id_tahunajaran: String(row['Tahun Ajaran'] || '').trim(),
  bobot: parseFloat(row['Bobot (%)']) || 0,
  status: String(row['Status'] || 'Aktif').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];
  if (!row.id_penilaian) errors.push('Jenis Penilaian wajib diisi');
  if (!row.id_lembaga || !row.lembaga_type)
    errors.push('Tipe & Lembaga wajib diisi');
  if (!row.id_tahunajaran) errors.push('Tahun Ajaran wajib diisi');
  if (row.bobot <= 0) errors.push('Bobot (%) harus lebih besar dari 0');
  return errors;
};
export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list({});
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`list: ${err?.message}`, 500, res);
    }
  }

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
      return helper.catchError(`index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({
        id_bobot: id,
      });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const body = req.body;
      const dataArray = Array.isArray(body) ? body : [body];
      const validatedPayload = [];

      for (const item of dataArray) {
        // A. Validasi Schema (Zod)
        const validData = bobotSchema.parse(item);

        // B. Validasi Business Logic (Unique & Total Bobot)
        await repository.validateBobotLogic(validData);

        validatedPayload.push(helper.only(variable.fillable(), validData));
      }

      await repository.create({ payload: validatedPayload });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      return helper.catchError(err?.message, 400, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      const check: any = await repository.detail({ id_bobot: id });
      if (!check || check.length === 0)
        return response.success(NOT_FOUND, null, res, false);

      // A. Validasi Schema (Partial update)
      const validData = bobotSchema.partial().parse(req.body);

      // B. Merge data lama dengan data baru untuk divalidasi
      // Karena repository.detail Anda mengembalikan raw query (array), ambil index 0
      const mergedData = { ...check[0], ...validData };

      await repository.validateBobotLogic(mergedData, id);

      const payload = helper.only(variable.fillable(), validData, true);
      await repository.update({
        payload: payload,
        condition: { id_bobot: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(err?.message, 400, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_bobot: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      await repository.delete({
        condition: { id_bobot: id },
      });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`Delete: ${err?.message}`, 500, res);
    }
  }

  public async export(req: Request, res: Response) {
    try {
      const { q, template } = req?.body;
      const isTemplate: boolean = template && template == '1';

      let result = await repository.listForExport({ q, isTemplate });

      const { dir, path } = await helper.checkDirExport('excel');
      const filename = `bobot-penilaian-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('BOBOT PENILAIAN');

      generateDataExcel(sheet, result, isTemplate);
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success(
        'export excel bobot penilaian',
        `${dir}/${filename}`,
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `export excel bobot penilaian: ${err?.message}`,
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
        const errors = validateRow(row);

        console.log('Processing Row:', row);

        let id_penilaian = null,
          id_lembaga = null,
          id_tingkat = null,
          id_tahunajaran = null;

        if (row.id_penilaian) {
          const penilaian = await penilaianRepo.detail({
            id_penilaian: row.id_penilaian,
          });
          if (penilaian) id_penilaian = penilaian.id_penilaian;
          else
            errors.push(
              `ID Jenis Penilaian "${row.id_penilaian}" tidak ditemukan`
            );
        }

        if (row.id_lembaga && row.lembaga_type) {
          const repo =
            row.lembaga_type === 'FORMAL' ? formalRepo : pesantrenRepo;
          const lembaga = await repo.detail({ id_lembaga: row.id_lembaga });
          if (lembaga) id_lembaga = lembaga.id_lembaga;
          else
            errors.push(
              `ID Lembaga ${row.lembaga_type} "${row.id_lembaga}" tidak ditemukan`
            );
        }

        if (row.id_tingkat) {
          const tingkat = await tingkatRepo.detail({
            id_tingkat: row.id_tingkat,
          });
          if (tingkat) id_tingkat = tingkat.id_tingkat;
          else errors.push(`ID Tingkat "${row.id_tingkat}" tidak ditemukan`);
        }

        if (row.id_tahunajaran) {
          const ta = await tahunRepo.detail({
            id_tahunajaran: row.id_tahunajaran,
          });
          if (ta) id_tahunajaran = ta.id_tahunajaran;
          else
            errors.push(
              `ID Tahun Ajaran "${row.id_tahunajaran}" tidak ditemukan`
            );
        }

        let valid = errors.length === 0;
        const payload = {
          id_penilaian,
          id_lembaga,
          id_tingkat: id_tingkat || null, // Tingkat bersifat opsional
          id_tahunajaran,
          lembaga_type: row.lembaga_type,
          bobot: row.bobot,
          status: row.status,
        };

        if (errors.length === 0) {
          try {
            await repository.validateBobotLogic(payload);
          } catch (businessErr: any) {
            valid = false;
            errors.push(businessErr.message);
          }
        }

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
          'import bobot penilaian berhasil',
          dataRes,
          res
        );
      }

      return response.success(
        'preview import bobot penilaian',
        { ...dataRes, data: results },
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `import excel bobot penilaian: ${err?.message}`,
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
        'Import batch berhasil',
        { count: payloads.length },
        res
      );
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  };
}

export const JenisPenilaianBobot = new Controller();
