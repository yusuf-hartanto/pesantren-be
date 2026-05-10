'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './lembaga.pendidikan.kepesantrenan.variable';
import { response } from '../../../helpers/response';
import { repository } from './lembaga.pendidikan.kepesantrenan.repository';
import { repository as cabangRepository } from '../cabang/cabang.repository';
import {
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import { Op } from 'sequelize';
import { lembagaSchema } from './lembaga.pendidikan.kepesantrenan.schema';
import z from 'zod';
import moment from 'moment';
import fs from 'fs/promises';
import ExcelJS from "exceljs";

const generateDataExcel = (sheet: any, details: any) => {
  sheet.addRow([
    'No',
    'Nama Lembaga',
    'Cabang',
    'Keterangan',
  ]);

  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Nama Lembaga', key: 'nama', width: 30 },
    { header: 'Cabang', key: 'cabang', width: 25 },
    { header: 'Keterangan', key: 'ket', width: 50 },
  ];

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.nama_lembaga || '',
      details[i]?.cabang?.nama_cabang || '',
      details[i]?.keterangan || '',
    ]);
  }

  for (let row = 1; row <= (details?.length || 0) + 1; row++) {
    sheet.getRow(row).eachCell((cell: any) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });
  }
  return sheet;
};

const normalizeRow = (row: any) => ({
  nama_lembaga: String(row['Nama Lembaga'] || '').trim(),
  cabang: String(row['Cabang'] || '').trim(),
  keterangan: String(row['Keterangan'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];
  if (!row.nama_lembaga) {
    errors.push('Nama Lembaga wajib diisi');
  }
  if (!row.cabang) {
    errors.push('Cabang wajib diisi');
  }
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
      return helper.catchError(`LP Kepesantrenan list: ${err?.message}`, 500, res);
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
      return helper.catchError(`LP Kepesantrenan index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: any = await repository.detail({ id_lembaga: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`LP Kepesantrenan detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      // Validasi Schema menggunakan Zod (mendukung Array/Bulk atau Single Object)
      const payload = Array.isArray(req.body) 
        ? z.array(lembagaSchema).parse(req.body) 
        : [lembagaSchema.parse(req.body)];

      const finalData = [];

      for (const item of payload) {
        // Validasi ID Cabang (Referensial)
        const cabangExist = await repository.checkCabangExists(item.id_cabang);
        if (!cabangExist) throw new Error(`Cabang dengan ID tersebut tidak ditemukan.`);

        // Cek Duplikasi (Kombinasi id_cabang + nama_lembaga)
        const isDuplicate = await repository.detail({
          id_cabang: item.id_cabang,
          nama_lembaga: item.nama_lembaga,
        });

        if (isDuplicate) throw new Error(`Lembaga "${item.nama_lembaga}" sudah terdaftar di cabang ini.`);
        
        finalData.push(item);
      }
        
      await repository.create({ payload: finalData });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;

      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        const fieldName = firstIssue.path.join('.'); 
        errorMessage = `Field [${fieldName}]: ${firstIssue.message}`;
        errorCode = 400;
      }

      return helper.catchError(`LP Kepesantrenan create: ${errorMessage}`, errorCode, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      // Ambil data lama
      const existingData: any = await repository.detail({ id_lembaga: id });
      if (!existingData) return response.success(NOT_FOUND, null, res, false);

      // Validasi input (menggunakan schema yang sama atau partial)
      const validatedData = lembagaSchema.parse(req.body);

      // Gabungkan data untuk pengecekan logika bisnis
      const mergedData = { ...existingData.get({ plain: true }), ...validatedData };

      // Validasi ID Cabang jika diubah
      if (validatedData?.id_cabang) {
        const cabangExist = await repository.checkCabangExists(validatedData?.id_cabang);
        if (!cabangExist) throw new Error(`Cabang tidak ditemukan.`);
      }

      // Check duplicate (Kombinasi nama + cabang, kecuali dirinya sendiri)
      const isDuplicate = await repository.detail({
        id_cabang: mergedData.id_cabang,
        nama_lembaga: mergedData.nama_lembaga,
        id_lembaga: { [Op.ne]: id }
      });

      if (isDuplicate) {
        throw new Error(`Nama lembaga "${mergedData.nama_lembaga}" sudah digunakan di cabang ini.`);
      }

      // Eksekusi Update
      await repository.update({
        payload: helper.only(variable.fillable(), mergedData, true), 
        condition: { id_lembaga: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;

      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        const fieldName = firstIssue.path.join('.'); 
        errorMessage = `Field [${fieldName}]: ${firstIssue.message}`;
        errorCode = 400;
      }

      return helper.catchError(`LP Kepesantrenan update: ${errorMessage}`, errorCode, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      // Cek eksistensi
      const check = await repository.detail({ id_lembaga: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // Eksekusi penghapusan (Soft Delete otomatis karena model paranoid)
      await repository.delete({
        condition: { id_lembaga: id },
      });

      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`LP Kepesantrenan delete: ${err?.message}`, 500, res);
    }
  }

  public async export(req: Request, res: Response) {
    try {
      let condition: any = {};
      const { q, template } = req?.body;
      const isTemplate: boolean = template && template == '1';

      if (q) {
        condition = {
          ...condition,
          nama_lembaga: { [Op.like]: `%${q}%` },
        };
      }

      let result: any = [];
      if (!isTemplate) {
        result = await repository.listForExport(condition);
        if (result?.length < 1) return response.success(NOT_FOUND, null, res, false);
      } else {
        // Ambil 5 data sample untuk template
        result = await repository.listForExport({}, 5);
      }

      const { dir, path } = await helper.checkDirExport('excel');
      const name: string = 'lembaga-kepesantrenan';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;
      const title: string = 'DATA LEMBAGA KEPESANTRENAN';
      const urlExcel: string = `${dir}/${filename}`;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title);

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success('export excel lembaga kepesantrenan', urlExcel, res);
    } catch (err: any) {
      return helper.catchError(`export excel lembaga: ${err?.message}`, 500, res);
    }
  }

  public async import(req: Request, res: Response) {
    const mode: 'preview' | 'commit' = req.body?.mode ?? 'preview';
    const uploaded = req.files?.file_import;

    if (!uploaded) return response.success('File tidak valid', null, res, false);

    try {
      const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      const buffer = file.tempFilePath ? await fs.readFile(file.tempFilePath) : file.data;

      const results: any[] = [];
      const rows = await helper.parseImportFile({ name: file.name, data: buffer });

      for (const raw of rows) {
        const row = normalizeRow(raw);
        const errors = validateRow(row);

        // Resolve ID Cabang berdasarkan nama yang diinput di Excel
        let id_cabang = null;
        if (row.cabang) {
          const cabang = await cabangRepository.findByName(row.cabang);
          if (cabang) {
            id_cabang = cabang.id_cabang;
          } else {
            errors.push(`Cabang "${row.cabang}" tidak ditemukan`);
          }
        }

        const valid = errors.length === 0;
        const payload = {
          nama_lembaga: row.nama_lembaga,
          id_cabang: id_cabang,
          keterangan: row.keterangan,
        };

        results.push({
          row: row.__row,
          valid,
          error: errors.length ? errors.join(', ') : null,
          payload
        });
      }

      const dataRes = {
        mode,
        total: results.length,
        valid: results.filter((r) => r.valid).length,
        invalid: results.filter((r) => !r.valid).length,
      };

      if (mode === 'commit') {
        const validPayloads = results.filter(r => r.valid).map(r => r.payload);
        if (validPayloads.length > 0) {
          await repository.insertImport(validPayloads);
        }
        return response.success('import lembaga berhasil', dataRes, res);
      }

      return response.success('preview import lembaga', { ...dataRes, data: results }, res);
    } catch (err: any) {
      return helper.catchError(`import excel lembaga: ${err?.message}`, 500, res);
    }
  }

  public insert = async (req: Request, res: Response) => {
    const payloads = req.body?.data as any[];

    if (!payloads || payloads.length === 0) {
      return response.success('Tidak ada data untuk disimpan', null, res, false);
    }

    try {
      await repository.insertImport(payloads);
      return response.success('Import Lembaga Berhasil', {
        count: payloads.length
      }, res);
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  }
}

export const LembagaPendidikanKepesantrenan = new Controller();