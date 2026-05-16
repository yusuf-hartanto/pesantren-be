'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './jenis.penilaian.variable';
import { response } from '../../../helpers/response';
import { repository } from './jenis.penilaian.repository';
import { jenisPenilaianSchema } from './jenis.penilaian.schema';
import { z } from 'zod';
import {
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import moment from 'moment';
import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import { Op } from 'sequelize';

const generateDataExcel = (sheet: any, details: any) => {
  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Jenis Pengujian', key: 'jenis_pengujian', width: 30 },
    { header: 'Singkatan', key: 'singkatan', width: 15 },
    { header: 'Lembaga Type', key: 'lembaga_type', width: 15 },
    { header: 'Ujian?', key: 'is_ujian', width: 10 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Keterangan', key: 'keterangan', width: 40 },
  ];

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
  });

  details.forEach((item: any, i: number) => {
    sheet.addRow({
      no: i + 1,
      jenis_pengujian: item.jenis_pengujian || '',
      singkatan: item.singkatan || '',
      lembaga_type: item.lembaga_type || '',
      is_ujian: item.is_ujian === 1 ? 'Ya' : 'Tidak',
      status: item.status === 'active' ? 'Aktif' : 'Non-Aktif',
      keterangan: item.keterangan || '',
    });
  });

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
  jenis_pengujian: String(row['Jenis Pengujian'] || '').trim(),
  singkatan: String(row['Singkatan'] || '').trim(),
  lembaga_type: String(row['Lembaga Type'] || '')
    .toUpperCase()
    .trim(),
  is_ujian: String(row['Ujian?'] || '').toLowerCase() === 'ya' ? 1 : 0,
  status:
    String(row['Status'] || '').toLowerCase() === 'aktif'
      ? 'active'
      : 'inactive',
  keterangan: String(row['Keterangan'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors = [];

  // singkatan: max 10 karakter
  if (row.singkatan && row.singkatan.toString().length > 10) {
    errors.push('Singkatan maksimal 10 karakter');
  }

  // jenis_pengujian: wajib diisi
  if (!row.jenis_pengujian || row.jenis_pengujian.toString().trim() === '') {
    errors.push('Jenis pengujian wajib diisi');
  }

  // lembaga_type: enum ['FORMAL', 'PESANTREN']
  const validLembaga = ['FORMAL', 'PESANTREN'];
  if (!row.lembaga_type) {
    errors.push('Lembaga type wajib diisi');
  } else if (!validLembaga.includes(row.lembaga_type)) {
    errors.push(
      `Lembaga type harus salah satu dari: ${validLembaga.join(', ')}`
    );
  }

  // is_ujian: number, integer, min 0, max 1
  const isUjianNum = parseInt(row.is_ujian);
  if (!['0', '1'].includes(isUjianNum.toString())) {
    errors.push('is_ujian hanya boleh 0 atau 1');
  }

  // status: enum ['active', 'inactive']
  const validStatus = ['active', 'inactive'];
  // Karena ada default 'active', kita hanya validasi jika field ini diisi
  if (row.status && !validStatus.includes(row.status)) {
    errors.push(`Status harus salah satu dari: ${validStatus.join(', ')}`);
  }

  return errors;
};
export default class Controller {
  constructor() {
    // Binding Private Methods
    this.validateBusinessLogic = this.validateBusinessLogic.bind(this);

    // Binding Public Methods (API Handlers)
    this.list = this.list.bind(this);
    this.index = this.index.bind(this);
    this.detail = this.detail.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  private async validateBusinessLogic(item: any, id_penilaian?: string) {
    // Validasi Unik: jenis_pengujian per lembaga_type
    const isExist = await repository.checkDuplicate(
      item.jenis_pengujian,
      item.lembaga_type,
      id_penilaian
    );

    if (isExist) {
      throw new Error(
        `Jenis pengujian '${item.jenis_pengujian}' sudah terdaftar untuk lembaga ${item.lembaga_type}`
      );
    }

    return item;
  }

  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list(req.query);
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `Jenis Penilaian list: ${err?.message}`,
        500,
        res
      );
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
      return helper.catchError(
        `Jenis Penilaian index: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await repository.detail({ id_penilaian: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `Jenis Penilaian detail: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const body = req.body;
      const payloadArray = Array.isArray(body) ? body : [body];
      const validatedData = [];

      for (const item of payloadArray) {
        // 1. Zod Validation
        const validItem = jenisPenilaianSchema.parse(item);

        // 2. Business Logic Validation (Unique Constraint)
        await this.validateBusinessLogic(validItem);

        // 3. Filter Fillable
        validatedData.push(helper.only(variable.fillable(), validItem));
      }

      await repository.create({ payload: validatedData });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      const msg =
        err instanceof z.ZodError ? err.issues[0].message : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const check: any = await repository.detail({ id_penilaian: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // 1. Zod Partial Validation
      const validData = jenisPenilaianSchema.partial().parse(req.body);

      // 2. Business Logic Validation (Merge existing with new data to check unique)
      const mergedData = { ...check.toJSON(), ...validData };
      await this.validateBusinessLogic(mergedData, id);

      const payload = helper.only(variable.fillable(), validData, true);
      await repository.update({
        payload: { ...payload, updated_at: new Date() },
        condition: { id_penilaian: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      const msg =
        err instanceof z.ZodError ? err.issues[0].message : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const check = await repository.detail({ id_penilaian: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      await repository.delete({ condition: { id_penilaian: id } });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `Jenis Penilaian delete: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async export(req: Request, res: Response) {
    try {
      let condition: any = {};
      const { q, template } = req?.body;
      const isTemplate: boolean = template && template == '1';

      if (q) condition = { keterangan: { [Op.like]: `%${q}%` } };

      const result = await repository.list(isTemplate ? 5 : condition);
      if (!isTemplate && result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);

      const { dir, path } = await helper.checkDirExport('excel');
      const filename = `jenis-penilaian-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('DATA JENIS PENILAIAN');

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success(
        'export excel jenis penilaian',
        `${dir}/${filename}`,
        res
      );
    } catch (err: any) {
      return helper.catchError(`export excel: ${err?.message}`, 500, res);
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

        const valid = errors.length === 0;
        const payload = helper.only(variable.fillable(), row);

        results.push({
          row: row.__row,
          valid,
          error: errors.join(', ') || null,
          payload,
        });
      }

      if (mode === 'commit') {
        const validPayloads = results
          .filter((r) => r.valid)
          .map((r) => r.payload);
        if (validPayloads.length > 0)
          await repository.insertImport(validPayloads);
        return response.success(
          'import berhasil',
          { total: validPayloads.length },
          res
        );
      }

      return response.success(
        'preview import',
        { total: results.length, data: results },
        res
      );
    } catch (err: any) {
      return helper.catchError(`import excel: ${err?.message}`, 500, res);
    }
  }

  public insert = async (req: Request, res: Response) => {
    const payloads = req.body?.data as any[];
    if (!payloads || payloads.length === 0)
      return response.success('Data kosong', null, res, false);

    try {
      await repository.insertImport(payloads);
      return response.success(SUCCESS_SAVED, { count: payloads.length }, res);
    } catch (err: any) {
      return helper.catchError(`insert batch gagal: ${err.message}`, 500, res);
    }
  };
}

export const JenisPenilaian = new Controller();
