'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './lembaga.pendidikan.formal.variable';
import { response } from '../../../helpers/response';
import { repository } from './lembaga.pendidikan.formal.repository';
import { repository as cabangRepository } from '../cabang/cabang.repository';

import {
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import { Op } from 'sequelize';
import { lembagaFormalSchema } from './lembaga.pendidikan.formal.schema';
import z from 'zod';
import moment from 'moment';
import fs from 'fs/promises';
import ExcelJS from "exceljs";

const generateDataExcel = (sheet: any, details: any) => {
  // Setup Kolom sesuai Model Lembaga Pendidikan Formal
  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Nama Lembaga', key: 'nama', width: 30 },
    { header: 'Jenis', key: 'jenis', width: 15 },
    { header: 'Akreditasi', key: 'akreditasi', width: 15 },
    { header: 'NPSN', key: 'npsn', width: 20 },
    { header: 'Cabang', key: 'cabang', width: 25 },
    { header: 'Keterangan', key: 'ket', width: 40 },
  ];

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });

  for (let i in details) {
    sheet.addRow({
      no: parseInt(i) + 1,
      nama: details[i]?.nama_lembaga || '',
      jenis: details[i]?.jenis_lembaga || '',
      akreditasi: details[i]?.status_akreditasi || '',
      npsn: details[i]?.nomor_npsn || '',
      cabang: details[i]?.cabang?.nama_cabang || '',
      ket: details[i]?.keterangan || '',
    });
  }

  for (let row = 1; row <= (details?.length || 0) + 1; row++) {
    sheet.getRow(row).eachCell((cell: any) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  }
  return sheet;
};

const normalizeRow = (row: any) => ({
  nama_lembaga: String(row['Nama Lembaga'] || '').trim(),
  jenis_lembaga: String(row['Jenis'] || '').trim(),
  status_akreditasi: String(row['Akreditasi'] || '').trim(),
  nomor_npsn: String(row['NPSN'] || '').trim(),
  nama_cabang: String(row['Cabang'] || '').trim(),
  keterangan: String(row['Keterangan'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];
  if (!row.nama_lembaga) errors.push('Nama Lembaga wajib diisi');
  
  // Validasi Enum Jenis Lembaga
  const validJenis = ['SD', 'MI', 'SMP', 'MTs', 'SMA', 'MA', 'SMK', 'Diniyah', 'Perguruan Tinggi'];
  if (row.jenis_lembaga && !validJenis.includes(row.jenis_lembaga)) {
    errors.push(`Jenis Lembaga harus salah satu dari: ${validJenis.join(', ')}`);
  }

  // Validasi Enum Akreditasi
  const validAkreditasi = ['A', 'B', 'C', 'Belum Terakreditasi'];
  if (row.status_akreditasi && !validAkreditasi.includes(row.status_akreditasi)) {
    errors.push(`Status Akreditasi harus salah satu dari: ${validAkreditasi.join(', ')}`);
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
      return helper.catchError(`LP Formal list: ${err?.message}`, 500, res);
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
      return helper.catchError(`LP Formal index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: any = await repository.detail({ id_lembaga: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`LP Formal detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      // 1. Validasi Schema (Bulk atau Single)
      const payload = Array.isArray(req.body) 
        ? z.array(lembagaFormalSchema).parse(req.body) 
        : [lembagaFormalSchema.parse(req.body)];

      const finalData = [];

      for (const item of payload) {
        // 2. Validasi Relasi Cabang
        if (item.id_cabang) {
          const cabangExist = await repository.checkCabangExists(item.id_cabang);
          if (!cabangExist) throw new Error(`Cabang dengan ID "${item.id_cabang}" tidak ditemukan.`);
        }

        // 3. Cek Duplikasi (Nama + NPSN)
        const isDuplicate = await repository.detail({
          [Op.or]: [
            { nama_lembaga: item.nama_lembaga },
            { nomor_npsn: item.nomor_npsn ? item.nomor_npsn : 'DUMMY_NONE' }
          ]
        });

        if (isDuplicate) {
           const reason = isDuplicate.nama_lembaga === item.nama_lembaga ? 'Nama' : 'NPSN';
           throw new Error(`${reason} lembaga sudah terdaftar di cabang ini.`);
        }
        
        finalData.push(item);
      }
        
      await repository.create({ payload: finalData });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;

      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        errorMessage = `Field [${firstIssue.path.join('.')}]: ${firstIssue.message}`;
        errorCode = 400;
      }

      return helper.catchError(`LP Formal create: ${errorMessage}`, errorCode, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      const existingData: any = await repository.detail({ id_lembaga: id });
      if (!existingData) return response.success(NOT_FOUND, null, res, false);

      // Validasi partial schema (zod)
      const validatedData = lembagaFormalSchema.parse(req.body);
      const mergedData = { ...existingData.get({ plain: true }), ...validatedData };

      // Cek duplikasi kecuali dirinya sendiri
      const isDuplicate = await repository.detail({
        [Op.or]: [
          { nama_lembaga: mergedData.nama_lembaga },
          { nomor_npsn: mergedData.nomor_npsn ? mergedData.nomor_npsn : 'DUMMY_NONE' }
        ],
        // id_cabang: mergedData.id_cabang || null,
        id_lembaga: { [Op.ne]: id }
      });

      if (isDuplicate) throw new Error(`Data sudah digunakan oleh lembaga formal lain.`);

      await repository.update({
        payload: helper.only(variable.fillable(), mergedData, true), 
        condition: { id_lembaga: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;

      if (err instanceof z.ZodError) {
        errorMessage = `Field [${err.issues[0].path.join('.')}]: ${err.issues[0].message}`;
        errorCode = 400;
      }

      return helper.catchError(`LP Formal update: ${errorMessage}`, errorCode, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      const check = await repository.detail({ id_lembaga: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      await repository.delete({
        condition: { id_lembaga: id },
      });

      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`LP Formal delete: ${err?.message}`, 500, res);
    }
  }

  public async export(req: Request, res: Response) {
    try {
      const { q, template } = req?.body;
      const isTemplate: boolean = template && template == '1';
    
      let result = await repository.listForExport({ q, isTemplate });

      const { dir, path } = await helper.checkDirExport('excel');
      
      const name: string = 'lembaga-pendidikan-formal';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;
      const urlExcel: string = `${dir}/${filename}`;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('DATA LEMBAGA PENDIDIKAN FORMAL');

      generateDataExcel(sheet, result);
      
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success(`export excel ${name.replace(/-/g, ' ')}`, urlExcel, res);
    } catch (err: any) {
      return helper.catchError(`export excel lembaga pendidikan formal: ${err?.message}`, 500, res);
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

        // Resolve ID Cabang berdasarkan nama
        let id_cabang = null;
        if (row.nama_cabang) {
          const cabang = await cabangRepository.findByName(row.nama_cabang);
          if (cabang) {
            id_cabang = cabang.id_cabang;
          } else {
            errors.push(`Cabang "${row.nama_cabang}" tidak ditemukan`);
          }
        }

        const valid = errors.length === 0;
        const payload = {
          nama_lembaga: row.nama_lembaga,
          jenis_lembaga: row.jenis_lembaga || null,
          status_akreditasi: row.status_akreditasi || null,
          nomor_npsn: row.nomor_npsn || null,
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
        return response.success('import berhasil', dataRes, res);
      }

      return response.success('preview import', { ...dataRes, data: results }, res);

    } catch (err: any) {
      return helper.catchError(`import excel: ${err?.message}`, 500, res);
    }
  }

  public insert = async (req: Request, res: Response) => {
    const payloads = req.body?.data as any[];
    if (!payloads || payloads.length === 0) return response.success('Data kosong', null, res, false);

    try {
      await repository.insertImport(payloads);
      return response.success('Import Berhasil', { count: payloads.length }, res);
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  }
}

export const LembagaPendidikanFormal = new Controller();