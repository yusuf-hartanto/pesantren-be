'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './jabatan.variable';
import { response } from '../../../helpers/response';
import { repository } from './jabatan.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import z from 'zod';
import { jabatanSchema } from './jabatan.schema';
import moment from 'moment';
import fs from 'fs/promises';
import ExcelJS from "exceljs";
import { Op } from 'sequelize';

const date: string = helper.date();

const generateDataExcel = (sheet: any, details: any) => {
  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Kode Jabatan', key: 'kode_jabatan', width: 15 },
    { header: 'Nama Jabatan', key: 'nama_jabatan', width: 30 },
    { header: 'Unit Organisasi', key: 'unit', width: 25 },
    { header: 'Level', key: 'level_jabatan', width: 10 },
    { header: 'Sifat Jabatan', key: 'sifat_jabatan', width: 15 },
    { header: 'Keterangan', key: 'keterangan', width: 40 },
  ];

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  });

  details.forEach((item: any, i: number) => {
    sheet.addRow({
      no: i + 1,
      kode_jabatan: item.kode_jabatan || '',
      nama_jabatan: item.nama_jabatan || '',
      unit: item.orgunit?.nama_orgunit || '',
      level_jabatan: item.level_jabatan ?? '',
      sifat_jabatan: item.sifat_jabatan || '',
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
  kode_jabatan: String(row['Kode Jabatan'] || '').trim(),
  nama_jabatan: String(row['Nama Jabatan'] || '').trim(),
  nama_orgunit: String(row['Unit Organisasi'] || '').trim(),
  level_jabatan: row['Level'] ? parseInt(row['Level']) : null,
  sifat_jabatan: String(row['Sifat Jabatan'] || 'Umum').trim(),
  keterangan: String(row['Keterangan'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];
  if (!row.nama_jabatan) errors.push('Nama Jabatan wajib diisi');
  
  const validSifat = ['Biro', 'Bagian', 'Lembaga', 'Sub-Unit', 'Umum'];
  if (row.sifat_jabatan && !validSifat.includes(row.sifat_jabatan)) {
    errors.push(`Sifat Jabatan harus salah satu dari: ${validSifat.join(', ')}`);
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
      return helper.catchError(`jabatan list: ${err?.message}`, 500, res);
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
      return helper.catchError(`jabatan index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({ id_jabatan: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`jabatan detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const body = req.body;
      const payloadArray = Array.isArray(body) ? body : [body];
      const validatedData = [];

      for (const item of payloadArray) {
        const validItem = jabatanSchema.parse(item);

        // 1. Cek duplikasi KODE di unit tersebut
        const existKode = await repository.checkUniqueInOrgunit(validItem.id_orgunit, 'kode_jabatan', validItem.kode_jabatan);
        if (existKode) throw new Error(`Kode [${validItem.kode_jabatan}] sudah ada di unit ini.`);

        // 2. Cek duplikasi NAMA di unit tersebut
        const existNama = await repository.checkUniqueInOrgunit(validItem.id_orgunit, 'nama_jabatan', validItem.nama_jabatan);
        if (existNama) throw new Error(`Nama Jabatan [${validItem.nama_jabatan}] sudah ada di unit ini.`);

        validatedData.push(helper.only(variable.fillable(), validItem));
      }

      await repository.create({ payload: validatedData });
      return response.success(SUCCESS_SAVED, null, res);

    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;

      if (err instanceof z.ZodError) {
        errorMessage = `Field [${err.issues[0].path.join('.')}]: ${err.issues[0].message}`;
        errorCode = 400;
      } else if (err.message.includes('sudah digunakan')) {
        errorCode = 400;
      }

      return helper.catchError(`Jabatan create: ${errorMessage}`, errorCode, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      const check = await repository.detail({ id_jabatan: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // Validasi Partial Schema
      const validData = jabatanSchema.partial().parse(req.body);

      // Cek Unik jika kode atau orgunit diubah
      const orgId = validData.id_orgunit || check.id_orgunit;

      // Cek Kode jika berubah
      if (validData.kode_jabatan) {
        const exist = await repository.checkUniqueInOrgunit(orgId, 'kode_jabatan', validData.kode_jabatan, id);
        if (exist) throw new Error(`Kode [${validData.kode_jabatan}] sudah digunakan di unit ini.`);
      }

      // Cek Nama jika berubah
      if (validData.nama_jabatan) {
        const exist = await repository.checkUniqueInOrgunit(orgId, 'nama_jabatan', validData.nama_jabatan, id);
        if (exist) throw new Error(`Nama Jabatan [${validData.nama_jabatan}] sudah digunakan di unit ini.`);
      }

      const dataToUpdate = helper.only(variable.fillable(), validData, true);
      await repository.update({
        payload: dataToUpdate,
        condition: { id_jabatan: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);

    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;

      if (err instanceof z.ZodError) {
        errorMessage = `Field [${err.issues[0].path.join('.')}]: ${err.issues[0].message}`;
        errorCode = 400;
      }

      return helper.catchError(`Jabatan update: ${errorMessage}`, errorCode, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      const check = await repository.detail({ id_jabatan: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // 3. Proteksi Hapus: Cek relasi Pegawai
      const hasPegawai = await repository.checkHasPegawai(id);
      if (hasPegawai) {
        return response.failed(
          "Jabatan tidak bisa dihapus karena masih digunakan oleh data pegawai.", 
          400, 
          res
        );
      }

      await repository.delete({ condition: { id_jabatan: id } });
      return response.success(SUCCESS_DELETED, null, res);

    } catch (err: any) {
      return helper.catchError(`Jabatan delete: ${err?.message}`, 500, res);
    }
  }

  public async export(req: Request, res: Response) {
    try {
      let condition: any = {};
      const { q, template } = req?.body;
      const isTemplate: boolean = template && template == '1';

      if (q) {
        condition = { nama_jabatan: { [Op.like]: `%${q}%` } };
      }

      const result = await repository.listForExport(condition, isTemplate ? 5 : undefined);
      if (!isTemplate && result?.length < 1) return response.success(NOT_FOUND, null, res, false);

      const { dir, path } = await helper.checkDirExport('excel');
      const name: string = 'jabatan';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;
      
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('DATA JABATAN');

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success(`export excel ${name}`, `${dir}/${filename}`, res);
    } catch (err: any) {
      return helper.catchError(`export excel jabatan: ${err?.message}`, 500, res);
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
        const errors = validateRow(row);
        
        let id_orgunit = null;

        // Resolve Unit Organisasi
        // if (row.nama_orgunit) {
        //   const unit = await orgRepo.detail({ nama_orgunit: row.nama_orgunit });
        //   if (unit) {
        //     id_orgunit = unit.id_orgunit;
        //   } else {
        //     errors.push(`Unit Organisasi "${row.nama_orgunit}" tidak ditemukan`);
        //   }
        // }

        const valid = errors.length === 0;
        const payload = {
          kode_jabatan: row.kode_jabatan,
          nama_jabatan: row.nama_jabatan,
          id_orgunit,
          level_jabatan: row.level_jabatan,
          sifat_jabatan: row.sifat_jabatan,
          keterangan: row.keterangan,
        };

        results.push({
          row: row.__row,
          valid,
          error: errors.length ? errors.join(', ') : null,
          payload
        });
      }

      if (mode === 'commit') {
        const validPayloads = results.filter(r => r.valid).map(r => r.payload);
        if (validPayloads.length > 0) await repository.insertImport(validPayloads);
        return response.success('import jabatan berhasil', { total: validPayloads.length }, res);
      }

      return response.success('preview import jabatan', { total: results.length, data: results }, res);
    } catch (err: any) {
      return helper.catchError(`import excel jabatan: ${err?.message}`, 500, res);
    }
  }

  public insert = async (req: Request, res: Response) => {
    const payloads = req.body?.data as any[];
    if (!payloads || payloads.length === 0) return response.success('Data kosong', null, res, false);

    try {
      await repository.insertImport(payloads);
      return response.success('Import batch jabatan berhasil', { count: payloads.length }, res);
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  }
}

export const Jabatan = new Controller();
