'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './cabang.variable';
import { response } from '../../../helpers/response';
import { repository } from './cabang.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import ExcelJS from "exceljs";
import moment from 'moment';
import { Op } from 'sequelize';
import fs from 'fs/promises';

const date: string = helper.date();

const generateDataExcel = (sheet: any, details: any, isTemplate: boolean = false) => {
  sheet.addRow([
    'No',
    'Nama Cabang',
    'Provinsi',
    'Kota/Kabupaten',
    'Kecamatan',
    'Kelurahan',
    'Kontak',
    'Email',
    'Alamat',
    'Keterangan',
  ]);

  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Nama Cabang', key: 'nama', width: 30 },
    { header: 'Provinsi', key: 'provinsi', width: 30 },
    { header: 'Kota/Kabupaten', key: 'kota_kabupaten', width: 30 },
    { header: 'Kecamatan', key: 'kecamatan', width: 30 },
    { header: 'Kelurahan', key: 'kelurahan', width: 30 },
    { header: 'Kontak', key: 'contact', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Alamat', key: 'alamat', width: 40 },
    { header: 'Keterangan', key: 'keterangan', width: 40 },
  ];

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.nama_cabang || '',
      (isTemplate ? details[i]?.province_id : details[i]?.province?.name || ''),
      (isTemplate ? details[i]?.city_id : details[i]?.city?.name || ''),
      (isTemplate ? details[i]?.district_id : details[i]?.district?.name || ''),
      (isTemplate ? details[i]?.sub_district_id : details[i]?.subDistrict?.name || ''),
      details[i]?.contact || '',
      details[i]?.email || '',
      details[i]?.alamat || '',
      details[i]?.keterangan || '',
    ]);
  }

  const columnCount = sheet.columns.length;

  for (let row = 1; row <= (details?.length || 0) + 1; row++) {
    const currentRow = sheet.getRow(row);
    
    for (let col = 1; col <= columnCount; col++) {
      const cell = currentRow.getCell(col); // Get cell secara paksa meski kosong
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
  nama_cabang: String(row['Nama Cabang'] || '').trim(),
  provinsi: String(row['Provinsi'] || '').trim(),
  kota_kabupaten: String(row['Kota/Kabupaten'] || '').trim(),
  kecamatan: String(row['Kecamatan'] || '').trim(),
  kelurahan: String(row['Kelurahan'] || '').trim(),
  contact: String(row['Kontak'] || '').trim(),
  email: String(row['Email'] || '').trim(),
  alamat: String(row['Alamat'] || '').trim(),
  keterangan: String(row['Keterangan'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];
  if (!row.nama_cabang) {
    errors.push('Nama Cabang wajib diisi');
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
      return helper.catchError(`cabang list: ${err?.message}`, 500, res);
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
      return helper.catchError(`tingkat index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({ id_cabang: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`tingkat detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      let data = req?.body;

      if (Array.isArray(data)) {
        data = data.map((item) => helper.only(variable.fillable(), item));
        await repository.create({
          payload: data,
        });
      } else {
        data = helper.only(variable.fillable(), data);
        await repository.create({
          payload: [data],
        });
      }

      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      return helper.catchError(`cabang create: ${err?.message}`, 500, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_cabang: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      const data: Object = helper.only(variable.fillable(), req?.body, true);
      await repository.update({
        payload: { ...data },
        condition: { id_cabang: id },
      });
      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(`tingkat update: ${err?.message}`, 500, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_cabang: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      await repository.delete({
        condition: { id_cabang: id },
      });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`tingkat delete: ${err?.message}`, 500, res);
    }
  }

  public async export(req: Request, res: Response) {
    try {
      const { q, template } = req?.body;
      const isTemplate: boolean = template && template == '1';
    
      let result = await repository.listForExport({ q, isTemplate });

      const { dir, path } = await helper.checkDirExport('excel');
      const name: string = 'cabang';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;
      const title: string = 'DATA CABANG';
      const urlExcel: string = `${dir}/${filename}`;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title);

      generateDataExcel(sheet, result, isTemplate);
      await workbook.xlsx.writeFile(`${path}/${filename}`);
      
      return response.success('export excel cabang', urlExcel, res);
    } catch (err: any) {
      return helper.catchError(`export excel cabang: ${err?.message}`, 500, res);
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

        if (!row.nama_cabang) errors.push(`Nama Cabang tidak boleh kosong`);

        const areas = await repository.validateAreaIds(row);
        if (row.provinsi && !areas.province_id) errors.push(`ID Provinsi ${row.provinsi} tidak valid`);
        if (row.kota_kabupaten && !areas.city_id) errors.push(`ID Kota ${row.kota_kabupaten} tidak valid`);
        if (row.kecamatan && !areas.district_id) errors.push(`ID Kecamatan ${row.kecamatan} tidak valid`);
        if (row.kelurahan && !areas.sub_district_id) errors.push(`ID Kelurahan ${row.kelurahan} tidak valid`);

        const valid = errors.length === 0;
        const payload = {
          nama_cabang: row.nama_cabang,
          ...areas,
          contact: row.contact,
          email: row.email,
          alamat: row.alamat,
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

      // JIKA MODE COMMIT: Panggil fungsi repository yang mengurusi transaksi
      if (mode === 'commit') {
        const validPayloads = results.filter(r => r.valid).map(r => r.payload);
        if (validPayloads.length > 0) {
          await repository.insertImport(validPayloads);
        }
        return response.success('import cabang berhasil', dataRes, res);
      }

      // JIKA MODE PREVIEW: Kembalikan data untuk dicek user
      return response.success('preview import cabang', { ...dataRes, data: results }, res);

    } catch (err: any) {
      // Tidak perlu rollback manual di sini karena sudah dihandle repository
      return helper.catchError(`import excel cabang: ${err?.message}`, 500, res);
    }
  }

  public insert = async (req: Request, res: Response) => {
    const payloads = req.body?.data as any[];
    
    if (!payloads || payloads.length === 0) {
      return response.success('Tidak ada data untuk disimpan', null, res, false);
    }

    try {
      await repository.insertImport(payloads);
      
      return response.success('Import Cabang Berhasil', { 
        count: payloads.length 
      }, res);
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  }
}

export const cabang = new Controller();
