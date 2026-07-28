'use strict';

import ExcelJS from 'exceljs';
import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './master.slot.waktu.variable';
import { response } from '../../../helpers/response';
import { repository } from './master.slot.waktu.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
  TIMEZONE,
} from '../../../utils/constant';
import moment from 'moment';
import { masterSlotWaktuSchema } from './master.slot.waktu.schema';
import { sequelize } from '../../../database/connection';
import fs from 'fs/promises';
import MasterSlotWaktu from './master.slot.waktu.model';

const date: string = helper.date();

const generateDataExcel = (sheet: any, details: any) => {
  sheet.addRow([
    'No',
    'Kode Slot',
    'Jam (Mulai - Selesai)',
    'Aktif',
    'Keterangan',
  ]);

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.kode_slot || '',
      `${details[i]?.jam_mulai?.slice(0, -3)} - ${details[i]?.jam_selesai?.slice(0, -3)}`,
      details[i]?.is_active ? 'Ya' : 'Tidak',
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
  kode_slot: String(row['Kode Slot'] || '').trim(),
  jam_mulai: String(row['Jam (Mulai - Selesai)'] || '')
    .trim()
    .split(' - ')[0],
  jam_selesai: String(row['Jam (Mulai - Selesai)'] || '')
    .trim()
    .split(' - ')[1],
  active: String(row['Aktif'] || '').trim(),
  is_active: String(row['Aktif'] || '').trim() === 'Ya',
  keterangan: String(row['Keterangan'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];

  if (!['Ya', 'Tidak'].includes(row.active)) {
    errors.push('Aktif harus Ya atau Tidak');
  }

  const valid = masterSlotWaktuSchema.safeParse(row);

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
      const is_active: any = req?.query?.is_active || '';
      const result = await repository.list({ is_active });
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `master slot waktu list: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async index(req: Request, res: Response) {
    try {
      const query = {
        ...helper.fetchQueryRequest(req),
        status: req?.query?.status || '',
      };

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
        `master slot waktu index: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({
        id_master_slot_waktu: id,
      });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `master slot waktu detail: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const { kode_slot } = req?.body;

      const check = await repository.detail({ kode_slot });

      if (check) return response.failed(ALREADY_EXIST, 400, res);
      const data: Object = helper.only(variable.fillable(), req?.body);
      const result = await repository.create({
        payload: {
          ...data,
        },
      });

      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `master slot waktu create: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const { kode_slot } = req?.body;

      const check = await repository.detail({ id_master_slot_waktu: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      if (kode_slot !== check.kode_slot) {
        const duplicate = await repository.detail({ kode_slot });

        if (duplicate) {
          return response.failed(ALREADY_EXIST, 400, res);
        }
      }

      const data: Object = helper.only(variable.fillable(), req?.body, true);

      await repository.update({
        payload: {
          ...data,
        },
        condition: { id_master_slot_waktu: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `master slot waktu update: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_master_slot_waktu: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      await repository.delete({
        condition: { id_master_slot_waktu: id },
      });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `master slot waktu delete: ${err?.message}`,
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
        result = await repository.list({ is_active: q });
        if (result?.length < 1)
          return response.success(NOT_FOUND, null, res, false);
      }

      const { dir, path } = await helper.checkDirExport('excel');

      const name: string = 'master-slot-waktu';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().tz(TIMEZONE).format('DDMMYYYY')}.xlsx`;
      const title: string = `${name.replace(/-/g, ' ').toUpperCase()}`;
      const urlExcel: string = `${dir}/${filename}`;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title);

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);
      return response.success('export excel master slot waktu', urlExcel, res);
    } catch (err: any) {
      return helper.catchError(
        `export excel master slot waktu: ${err?.message}`,
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

        const kode_slot = row.kode_slot;

        const valid = errors.length === 0;

        const payload = {
          kode_slot: row.kode_slot,
          jam_mulai: row.jam_mulai,
          jam_selesai: row.jam_selesai,
          is_active: row.is_active,
          active: row.active,
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

        const existing = await repository.detail({ kode_slot });

        if (existing) {
          await existing.update(
            {
              ...payload,
            },
            { transaction: trx! }
          );
        } else {
          let newCreate = await MasterSlotWaktu.create(
            {
              ...payload,
            },
            { transaction: trx! }
          );
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
          'import master slot waktu berhasil',
          dataRes,
          res
        );
      }

      return response.success(
        'preview import master slot waktu',
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
        `import excel master slot waktu: ${err?.message}`,
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
          kode_slot: payload.kode_slot,
        });

        if (existing) {
          await existing.update(
            {
              ...payload,
            },
            { transaction: trx }
          );
        } else {
          let newCreate = await MasterSlotWaktu.create(
            {
              ...payload,
            },
            { transaction: trx }
          );
        }
      }

      await trx.commit();

      return response.success(
        'Import batch master slot waktu berhasil',
        { total: payloads.length },
        res
      );
    } catch (err: any) {
      await trx.rollback();
      return helper.catchError(`Import batch gagal: ${err.message}`, 500, res);
    }
  }
}

export const masterSlotWaktu = new Controller();
