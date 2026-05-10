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

  public export = async (req: Request, res: Response) => {
    try {
      const { q, template } = req.body;
      const isTemplate = template == '1';

      const condition = q ? { nama_cabang: { [Op.like]: `%${q}%` } } : {};
      const limit = isTemplate ? 5 : undefined;

      const result = await repository.listForExport(condition, limit);
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('DATA CABANG');

      sheet.columns = [
        { header: 'NAMA CABANG', key: 'nama_cabang', width: 30 },
        { header: 'PROVINSI', key: 'provinsi', width: 25 },
        { header: 'KOTA/KABUPATEN', key: 'kota', width: 25 },
        { header: 'KECAMATAN', key: 'kecamatan', width: 25 },
        { header: 'KELURAHAN', key: 'kelurahan', width: 25 },
        { header: 'KONTAK', key: 'contact', width: 20 },
        { header: 'EMAIL', key: 'email', width: 25 },
        { header: 'ALAMAT', key: 'alamat', width: 40 },
        { header: 'KETERANGAN', key: 'keterangan', width: 30 },
      ];

      result.forEach((item: any) => {
        sheet.addRow({
          nama_cabang: item.nama_cabang,
          provinsi: item.province?.name || '',
          kota: item.city?.name || '',
          kecamatan: item.district?.name || '',
          kelurahan: item.subDistrict?.name || '',
          contact: item.contact,
          email: item.email,
          alamat: item.alamat,
          keterangan: item.keterangan,
        });
      });

      const { dir, path } = await helper.checkDirExport('excel');
      const filename = `export-cabang-${moment().format('YYYYMMDDHHmmss')}.xlsx`;
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success('Export berhasil', `${dir}/${filename}`, res);
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  }

  public import = async (req: Request, res: Response) => {
    const uploaded = req.files?.file_import;
    if (!uploaded) return response.success('File tidak ditemukan', null, res, false);

    try {
      const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      const buffer = file.tempFilePath ? await fs.readFile(file.tempFilePath) : file.data;
      const rows = await helper.parseImportFile({ name: file.name, data: buffer }, true);
      const results: any[] = [];
      

      for (const raw of rows) {
        const errors: string[] = [];

        const { province_id,
          city_id,
          district_id,
          sub_district_id
        } = await repository.resolveAreaIds(raw);

        if (!raw.nama_cabang) errors.push("Nama cabang wajib diisi");
        // if (raw.provinsi && !province_id) {
        //   errors.push(`Provinsi "${raw.provinsi}" tidak ditemukan`);
        // }

        results.push({
          row: raw.__row,
          valid: errors.length === 0,
          error: errors.join(', ') || null,
          payload: {
            nama_cabang: raw.nama_cabang,
            province_id,
            city_id,
            district_id,
            sub_district_id,
            contact: raw.kontak,
            email: raw.email,
            alamat: raw.alamat,
            keterangan: raw.keterangan
          }
        });
      }

      return response.success('Preview Import Cabang', {
        total: results.length,
        valid: results.filter(r => r.valid).length,
        data: results
      }, res);
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  }

  public insert = async (req: Request, res: Response) => {
    const payloads = req.body?.data as any[];
    console.log('payloads', payloads)
    
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
