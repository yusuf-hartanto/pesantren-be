'use strict';

import fs from 'fs/promises';
import moment from 'moment';
import ExcelJS from 'exceljs';
import { Op } from 'sequelize';
import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { response } from '../../../helpers/response';
import { sequelize } from '../../../database/connection';
import { variable } from './penempatan.kamar.santri.variable';
import { repository } from './penempatan.kamar.santri.repository';
import {
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import Model from './penempatan.kamar.santri.model';
import { repository as repoSantri } from '../santri/santri.repository';
import { repository as repoLokasi } from '../location/location.repository';
import { repository as repoTahunAjaran } from '../tahun.ajaran/tahun.ajaran.repository';

const generateDataExcel = (sheet: any, details: any) => {
  sheet.addRow([
    'No',
    'Santri',
    'Lokasi',
    'Tahun Ajaran',
    'Tanggal Masuk',
    'Tanggal Keluar',
    'Status',
    'Keterangan',
  ]);

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.santri?.fullname || '',
      details[i]?.lokasi?.nama_lokasi || '',
      details[i]?.tahunAjaran?.tahun_ajaran || '',
      details[i]?.tanggal_masuk || '',
      details[i]?.tanggal_keluar || '',
      details[i]?.status || '',
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
  santri: String(row['Santri'] || '').trim(),
  lokasi: String(row['Lokasi'] || '').trim(),
  tahunajaran: String(row['Tahun Ajaran'] || '').trim(),
  tanggal_masuk: String(row['Tanggal Masuk'] || '').trim(),
  tanggal_keluar: String(row['Tanggal Keluar'] || '').trim(),
  status: String(row['Status'] || '').trim(),
  keterangan: String(row['Keterangan'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];
  if (!row.santri) {
    errors.push('Santri wajib diisi');
  }
  if (!row.lokasi) {
    errors.push('Lokasi wajib diisi');
  }
  if (!row.tahunajaran) {
    errors.push('Tahun Ajaran wajib diisi');
  }
  if (!row.tanggal_masuk) {
    errors.push('Tanggal Masuk wajib diisi');
  }
  if (!['Aktif', 'Non-Aktif'].includes(row.status)) {
    errors.push('Status hanya boleh Aktif dan Non-Aktif');
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
      console.log(err);
      return helper.catchError(`kamar list: ${err?.message}`, 500, res);
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
      return helper.catchError(`kamar index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({
        id_penempatan: id,
      });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`kamar detail: ${err?.message}`, 500, res);
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
      console.log(err);
      return helper.catchError(`kamar create: ${err?.message}`, 500, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_penempatan: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      const data: Object = helper.only(variable.fillable(), req?.body, true);
      await repository.update({
        payload: { ...data },
        condition: { id_penempatan: id },
      });
      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(`kamar update: ${err?.message}`, 500, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_penempatan: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      await repository.update({
        payload: {
          is_deleted: true,
          deleted_at: helper.date(),
        },
        condition: { id_penempatan: id },
      });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`kamar delete: ${err?.message}`, 500, res);
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
          ...{
            [Op.or]: [
              { status: { [Op.like]: q } },
              { '$lokasi.nama_lokasi$': { [Op.like]: q } },
              { '$santri.fullname$': { [Op.like]: q } },
              { '$tahunAjaran.tahun_ajaran$': { [Op.like]: q } },
            ],
          },
        };
      }

      let result: any = [];
      if (!isTemplate) {
        result = await repository.list(condition);
        if (result?.length < 1)
          return response.success(NOT_FOUND, null, res, false);
      }

      const { dir, path } = await helper.checkDirExport('excel');

      const name: string = 'penempatan-kamar-santri';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;
      const title: string = `${name.replace(/-/g, ' ').toUpperCase()}`;
      const urlExcel: string = `${dir}/${filename}`;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title);

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);
      return response.success('export excel kamar santri', urlExcel, res);
    } catch (err: any) {
      return helper.catchError(
        `export excel kamar santri: ${err?.message}`,
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

      for (const raw of rows) {
        const row = normalizeRow(raw);
        const errors = validateRow(row);

        let id_santri: string | null = null;
        let nama_santri: string | null = null;
        if (row.santri) {
          const santri = await repoSantri.detail({
            fullname: row.santri,
          });

          if (!santri) {
            errors.push(`Santri "${row.santri}" tidak ditemukan`);
          } else {
            id_santri = santri.getDataValue('id_santri');
            nama_santri = santri.getDataValue('nama_santri');
          }
        }

        let id_lokasi: string | null = null;
        let nama_lokasi: string | null = null;
        if (row.lokasi) {
          const lokasi = await repoLokasi.detail({
            nama_lokasi: row.lokasi,
          });

          if (!lokasi) {
            errors.push(`Lokasi "${row.lokasi}" tidak ditemukan`);
          } else {
            id_lokasi = lokasi.getDataValue('id_lokasi');
            nama_lokasi = lokasi.getDataValue('nama_lokasi');
          }
        }

        let id_tahunajaran: string | null = null;
        let tahun_ajaran: string | null = null;
        if (row.tahunajaran) {
          const tahunajaran = await repoTahunAjaran.detail({
            tahun_ajaran: row.tahunajaran,
          });

          if (!tahunajaran) {
            errors.push(`Tahun Ajaran "${row.tahunajaran}" tidak ditemukan`);
          } else {
            id_tahunajaran = tahunajaran.getDataValue('id_tahunajaran');
            tahun_ajaran = tahunajaran.getDataValue('tahun_ajaran');
          }
        }
        const valid = errors.length === 0;

        const payload = {
          id_santri,
          id_lokasi,
          id_tahunajaran,
          tanggal_masuk: row.tanggal_masuk,
          tanggal_keluar: row.tanggal_keluar || null,
          keterangan: row.keterangan || null,
          status: row.status || null,
        };

        results.push({
          row: row.__row,
          valid,
          error: errors.length ? errors.join(', ') : null,
          payload: {
            ...payload,
            nama_santri,
            nama_lokasi,
            tahun_ajaran,
          },
        });
        if (mode === 'preview' || !valid) continue;

        const existing = await repository.detail({
          id_santri,
          id_lokasi,
          id_tahunajaran,
        });

        if (existing) {
          await existing.update(
            {
              ...payload,
              updated_at: helper.date(),
            },
            { transaction: trx! }
          );
        } else {
          await Model.create(
            {
              ...payload,
              created_at: helper.date(),
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
        return response.success('import kamar santri berhasil', dataRes, res);
      }

      return response.success(
        'preview import kamar santri',
        {
          ...dataRes,
          data: results,
        },
        res
      );
    } catch (err: any) {
      if (trx) await trx.rollback();

      console.error(err);
      return helper.catchError(
        `import excel kamar santri: ${err?.message}`,
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
      for (const payload of payloads) {
        const existing = await repository.detail({
          id_santri: payload.id_santri,
          id_lokasi: payload.id_lokasi,
          id_tahunajaran: payload.id_tahunajaran,
        });

        if (existing) {
          await existing.update(
            {
              ...payload,
              updated_at: helper.date(),
            },
            { transaction: trx }
          );
        } else {
          await Model.create(
            {
              ...payload,
              created_at: helper.date(),
            },
            { transaction: trx }
          );
        }
      }
      await trx.commit();

      return response.success(
        'Import batch kamar santri berhasil',
        { total: payloads.length },
        res
      );
    } catch (err: any) {
      await trx.rollback();
      return helper.catchError(`Import batch gagal: ${err.message}`, 500, res);
    }
  }
}

export const PenempatanKamarSantri = new Controller();
