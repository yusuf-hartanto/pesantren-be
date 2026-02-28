'use strict';

import ExcelJS from 'exceljs';
import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './orang.tua.wali.variable';
import { response } from '../../../helpers/response';
import { repository } from './orang.tua.wali.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import moment from 'moment';
import { orangTuaWaliSchema } from './orang.tua.wali.schema';
import { sequelize } from '../../../database/connection';
import fs from 'fs/promises';
import { repository as areaRepository } from '../../area/area.repository';
import OrangTuaWali from './orang.tua.wali.model';

const date: string = helper.date();

const generateDataExcel = (sheet: any, details: any) => {
  sheet.addRow([
    'No',
    'Nama Wali',
    'Hubungan',
    'Nik',
    'Pendidikan',
    'Pekerjaan',
    'Penghasilan',
    'No Hp',
    'Alamat',
    'Provinsi',
    'Kabupaten',
    'Kecamatan',
    'Kelurahan',
    'Keterangan',
  ]);

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.nama_wali || '',
      details[i]?.hubungan || '',
      details[i]?.nik || '',
      details[i]?.pendidikan || '',
      details[i]?.pekerjaan || '',
      details[i]?.penghasilan || '',
      details[i]?.no_hp || '',
      details[i]?.alamat || '',
      details[i]?.province.name || '',
      details[i]?.city.name || '',
      details[i]?.district.name || '',
      details[i]?.sub_district.name || '',
      details[i]?.keterangan || '',
    ]);
  }

  for (let row = 1; row <= details?.length + 1; row++) {
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
  nama_wali: String(row['Nama Wali'] || '').trim(),
  hubungan: String(row['Hubungan'] || '').trim(),
  nik: String(row['Tahun Nik'] || '').trim(),
  pendidikan: String(row['Pendidikan'] || '').trim(),
  pekerjaan: String(row['Pekerjaan'] || '').trim(),
  penghasilan: String(row['Penghasilan'] || '').trim(),
  no_hp: String(row['No Hp'] || '').trim(),
  alamat: String(row['Alamat'] || '').trim(),
  provinsi: String(row['Provinsi'] || '').trim(),
  kabupaten: String(row['Kabupaten'] || '').trim(),
  kecamatan: String(row['Kecamatan'] || '').trim(),
  kelurahan: String(row['Kelurahan'] || '').trim(),
  keterangan: String(row['Keterangan'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];
  const valid = orangTuaWaliSchema.safeParse(row);

  if (!valid.success) {
    for (const e of valid.error.issues) {
      errors.push(e.message);
    }
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
      return helper.catchError(
        `orang tua wali list: ${err?.message}`,
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
        `orang tua wali index: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({
        id_wali: id,
        is_deleted: false,
      });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `orang tua wali detail: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const {
        id_santri,
        nik,
        province_id,
        city_id,
        district_id,
        sub_district_id,
      } = req?.body;

      const data: Object = helper.only(variable.fillable(), req?.body);

      await repository.create({
        payload: {
          ...data,
          id_santri: id_santri?.value || null,
          province_id: province_id?.value || null,
          city_id: city_id?.value || null,
          district_id: district_id?.value || null,
          sub_district_id: sub_district_id?.value || null,
        },
      });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `orang tua wali create: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_wali: id, is_deleted: false });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      const {
        id_santri,
        nik,
        province_id,
        city_id,
        district_id,
        sub_district_id,
      } = req?.body;

      const data: Object = helper.only(variable.fillable(), req?.body, true);
      await repository.update({
        payload: {
          ...data,
          id_santri: id_santri?.value || check?.getDataValue('id_santri'),
          province_id: province_id?.value || check?.getDataValue('province_id'),
          city_id: city_id?.value || check?.getDataValue('city_id'),
          district_id: district_id?.value || check?.getDataValue('district_id'),
          sub_district_id:
            sub_district_id?.value || check?.getDataValue('sub_district_id'),
        },
        condition: { id_wali: id },
      });
      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `orang tua wali update: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_wali: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      await repository.update({
        payload: {
          is_deleted: true,
          deleted_at: date,
        },
        condition: { id_wali: id },
      });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `orang tua wali delete: ${err?.message}`,
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

      let result: any = [];
      if (!isTemplate) {
        result = await repository.list({ status: q });
        if (result?.length < 1)
          return response.success(NOT_FOUND, null, res, false);
      }

      const { dir, path } = await helper.checkDirExport('excel');

      const name: string = 'orang-tua-wali';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;
      const title: string = `${name.replace(/-/g, ' ').toUpperCase()}`;
      const urlExcel: string = `${dir}/${filename}`;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title);

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);
      return response.success('export excel orang tua wali', urlExcel, res);
    } catch (err: any) {
      return helper.catchError(
        `export excel orang tua wali: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async import(req: Request, res: Response) {
    const mode: 'preview' | 'commit' = req.body?.mode ?? 'preview';
    const uploaded = req.files?.file_import;

    if (!uploaded) {
      return response.success('File tidak valid', null, res, false);
    }

    const trx = mode === 'commit' ? await sequelize.transaction() : null;

    try {
      let buffer: Buffer;
      const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      if (file.tempFilePath) {
        buffer = await fs.readFile(file.tempFilePath);
      } else if (file.data) {
        buffer = file.data;
      } else {
        return response.success(
          'File kosong atau gagal dibaca',
          null,
          res,
          false
        );
      }

      const results: any[] = [];
      const rows = await helper.parseImportFile({
        name: file.name,
        data: buffer,
      });

      let data = null;
      for (const raw of rows) {
        const row = normalizeRow(raw);
        const errors = validateRow(row);

        const nama_wali = row.nama_wali;
        const provinsi = row.provinsi;
        const city = row.kabupaten;
        const district = row.kecamatan;
        const subdistrict = row.kelurahan;

        const provinsiExist = await areaRepository.provinceDetail({ name: provinsi });
        if (!provinsiExist) {
          errors.push(`Provinsi ${provinsi} tidak ditemukan`);
        }

        const cityExist = await areaRepository.provinceDetail({ name: city });
        if (!cityExist) {
          errors.push(`Kota/Kabupaten ${city} tidak ditemukan`);
        }

        const districtExist = await areaRepository.provinceDetail({ name: district });
        if (!districtExist) {
          errors.push(`Kecamatan ${district} tidak ditemukan`);
        }

        const subdistrictExist = await areaRepository.provinceDetail({ name: subdistrict });
        if (!subdistrictExist) {
          errors.push(`Kelurahan ${subdistrict} tidak ditemukan`);
        }

        const valid = errors.length === 0;

        const payload = {
          nama_wali: row.nama_wali,
          hubungan: row.hubungan,
          nik: row.nik,
          pendidikan: row.pendidikan,
          pekerjaan: row.pekerjaan,
          penghasilan: row.penghasilan,
          no_hp: row.no_hp,
          alamat: row.alamat,
          province_id: provinsiExist?.id,
          provinsi: provinsiExist?.name,
          city_id: cityExist?.id,
          kabupaten: cityExist?.name,
          district_id: districtExist?.id,
          kecamatan: districtExist?.name,
          sub_district_id: subdistrictExist?.id,
          kelurahan: subdistrictExist?.name,
          keterangan: row.keterangan ?? null,
        };

        results.push({
          row: row.__row,
          valid,
          error: errors.length ? errors.join(', ') : null,
          payload: {
            ...payload,
          },
        });

        if (mode === 'preview' || !valid) continue;

        const existing = await repository.detail({ nama_wali });

        if (existing) {
          await existing.update({
            ...payload,
          }, { transaction: trx! });
        } else {
          let newCreate = await OrangTuaWali.create({
            ...payload,
          }, { transaction: trx! });
        }
      }

      let dataRes = {
        mode,
        total: results.length,
        valid: results.filter((r) => r.valid).length,
        invalid: results.filter((r) => !r.valid).length,
      };

      if (trx) {

        await trx.commit();
        
        return response.success(
          'import orang tua wali berhasil',
          dataRes,
          res
        );
      }

      return response.success(
        'preview import orang tua wali',
        {
          ...dataRes,
          data: results,
        },
        res
      );
    } catch (err: any) {
      if (trx) await trx.rollback();

      //console.error(err);
      return helper.catchError(
        `import excel orang tua wali: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async insert(req: Request, res: Response) {
    const payloads = req.body?.data as any[];

    if (!Array.isArray(payloads) || payloads.length === 0) {
      return response.success('Data import kosong', null, res, false);
    }

    const trx = await sequelize.transaction();
    try {
      let data = null;
      for (const payload of payloads) {
        const existing = await repository.detail({
          nama_wali: payload.nama_wali
        });

        if (existing) {
          await existing.update({
            ...payload,
          }, { transaction: trx });
        } else {
          let newCreate = await OrangTuaWali.create({
            ...payload,
          }, { transaction: trx });
        }
      }

      await trx.commit();

      return response.success(
        'Import batch orang tua wali berhasil',
        { total: payloads.length },
        res
      );
    } catch (err: any) {
      await trx.rollback();
      return helper.catchError(`Import batch gagal: ${err.message}`, 500, res);
    }
  }
}

export const orangTuaWali = new Controller();
