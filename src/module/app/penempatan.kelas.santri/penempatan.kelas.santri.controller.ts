'use strict';

import fs from 'fs/promises';
import moment from 'moment';
import ExcelJS from 'exceljs';
import { Op, Sequelize } from 'sequelize';
import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { response } from '../../../helpers/response';
import { sequelize } from '../../../database/connection';
import { repository } from './penempatan.kelas.santri.repository';
import { variable } from './penempatan.kelas.santri.variable';
import {
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import Model from './penempatan.kelas.santri.model';
import { repository as repoSantri } from '../santri/santri.repository';
import { repository as repoTahunAjaran } from '../tahun.ajaran/tahun.ajaran.repository';
import { repository as repoKelasMda } from '../kelas.mda/kelas.mda.repository';
import { repository as repoKelasFormal } from '../kelas.formal/kelas.formal.repository';

const generateDataExcel = (sheet: any, details: any) => {
  sheet.addRow([
    'No',
    'Santri',
    'Kelas MDA',
    'Kelas Formal',
    'Tahun Ajaran',
    'Tanggal Masuk',
    'Tanggal Keluar',
    'Status',
  ]);

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.santri?.fullname || '',
      details[i]?.kelasMda?.nama_kelas_mda || '',
      details[i]?.kelasFormal?.nama_kelas || '',
      details[i]?.tahunAjaran?.tahun_ajaran || '',
      details[i]?.tanggal_masuk || '',
      details[i]?.tanggal_keluar || '',
      details[i]?.status || '',
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
  kelas_mda: String(row['Kelas MDA'] || '').trim(),
  kelas_formal: String(row['Kelas Formal'] || '').trim(),
  tahunajaran: String(row['Tahun Ajaran'] || '').trim(),
  tanggal_masuk: String(row['Tanggal Masuk'] || '').trim(),
  tanggal_keluar: String(row['Tanggal Keluar'] || '').trim(),
  status: String(row['Status'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];
  if (!row.santri) {
    errors.push('Santri wajib diisi');
  }
  if (!row.tahunajaran) {
    errors.push('Tahun Ajaran wajib diisi');
  }
  if (!row.kelas_mda && !row.kelas_formal) {
    errors.push('Salah satu dari Kelas MDA atau Kelas Formal wajib diisi');
  }
  if (!['Aktif', 'Alumni', 'Tidak Aktif'].includes(row.status)) {
    errors.push('Status hanya boleh Aktif, Alumni, dan Tidak Aktif');
  }
  return errors;
};

export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const idSantri: any = req?.query?.id_santri || '';
      const status: any = req?.query?.status || '';
      const result = await repository.list({ id_santri: idSantri, status });
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `penempatan kelas list: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async index(req: Request, res: Response) {
    try {
      const query = {
        ...helper.fetchQueryRequest(req),
        id_santri: req?.query?.id_santri || '',
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
        `penempatan kelas index: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result = await repository.detail({ id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `penempatan kelas detail: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async create(req: Request, res: Response) {
    try {
      let data = req?.body;
      const creatorId = req?.user?.id || '00000000-0000-0000-0000-000000000000';

      const sanitizeItem = (item: any) => {
        const cleaned = helper.only(variable.fillable(), item);

        if (!cleaned.id_santri) {
          throw new Error('id_santri is required');
        }
        if (!cleaned.id_tahun_ajaran) {
          throw new Error('id_tahun_ajaran is required');
        }
        if (!cleaned.id_kelas_mda && !cleaned.id_kelas_formal) {
          throw new Error(
            'At least one of id_kelas_mda or id_kelas_formal is required'
          );
        }

        return {
          ...cleaned,
          created_by: creatorId,
        };
      };

      if (Array.isArray(data)) {
        if (data.length === 0) {
          return response.failed('Payload array cannot be empty', 422, res);
        }
        try {
          data = data.map(sanitizeItem);
        } catch (e: any) {
          return response.failed(e.message, 422, res);
        }
        await repository.create({ payload: data });
      } else {
        let payloadItem;
        try {
          payloadItem = sanitizeItem(data);
        } catch (e: any) {
          return response.failed(e.message, 422, res);
        }
        await repository.create({ payload: [payloadItem] });
      }

      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `penempatan kelas create: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      const data = helper.only(variable.fillable(), req?.body, true);
      const updaterId = req?.user?.id || '00000000-0000-0000-0000-000000000000';

      await repository.update({
        payload: {
          ...data,
          updated_by: updaterId,
        },
        condition: { id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `penempatan kelas update: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      await repository.delete({
        condition: { id },
      });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `penempatan kelas delete: ${err?.message}`,
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
      if (q) {
        const keyword = `%${q.toLowerCase()}%`;
        condition = {
          ...condition,
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.cast(
                  Sequelize.col('PenempatanKelasSantri.status'),
                  'TEXT'
                )
              ),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('santri.fullname')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('kelasMda.nama_kelas_mda')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('kelasFormal.nama_kelas')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('tahunAjaran.tahun_ajaran')),
              {
                [Op.like]: keyword,
              }
            ),
          ],
        };
      }

      let result: any = [];
      if (!isTemplate) {
        result = await repository.list(condition);
        if (result?.length < 1)
          return response.success(NOT_FOUND, null, res, false);
      }

      const { dir, path } = await helper.checkDirExport('excel');

      const name: string = 'penempatan-kelas-santri';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;
      const title: string = `${name.replace(/-/g, ' ').toUpperCase()}`;
      const urlExcel: string = `${dir}/${filename}`;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title);

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);
      return response.success('export excel kelas santri', urlExcel, res);
    } catch (err: any) {
      return helper.catchError(
        `export excel kelas santri: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async import(req: Request, res: Response) {
    const mode: 'preview' | 'commit' = req.body?.mode ?? 'preview';
    const uploaded = req.files?.file_import;
    const userId = req?.user?.id || '00000000-0000-0000-0000-000000000000';

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
            nama_santri = santri.getDataValue('fullname');
          }
        }

        let id_kelas_mda: string | null = null;
        let nama_kelas_mda: string | null = null;
        if (row.kelas_mda) {
          const kelasMda = await repoKelasMda.detail({
            nama_kelas_mda: row.kelas_mda,
          });

          if (!kelasMda) {
            errors.push(`Kelas MDA "${row.kelas_mda}" tidak ditemukan`);
          } else {
            id_kelas_mda = kelasMda.getDataValue('id_kelas_mda');
            nama_kelas_mda = kelasMda.getDataValue('nama_kelas_mda');
          }
        }

        let id_kelas_formal: string | null = null;
        let nama_kelas_formal: string | null = null;
        if (row.kelas_formal) {
          const kelasFormal = await repoKelasFormal.detail({
            nama_kelas: row.kelas_formal,
          });

          if (!kelasFormal) {
            errors.push(`Kelas Formal "${row.kelas_formal}" tidak ditemukan`);
          } else {
            id_kelas_formal = kelasFormal.getDataValue('id_kelas');
            nama_kelas_formal = kelasFormal.getDataValue('nama_kelas');
          }
        }

        let id_tahun_ajaran: string | null = null;
        let tahun_ajaran: string | null = null;
        if (row.tahunajaran) {
          const tahunajaran = await repoTahunAjaran.detail({
            tahun_ajaran: row.tahunajaran,
          });

          if (!tahunajaran) {
            errors.push(`Tahun Ajaran "${row.tahunajaran}" tidak ditemukan`);
          } else {
            id_tahun_ajaran = tahunajaran.getDataValue('id_tahunajaran');
            tahun_ajaran = tahunajaran.getDataValue('tahun_ajaran');
          }
        }

        const valid = errors.length === 0;

        const payload = {
          id_santri,
          id_kelas_mda,
          id_kelas_formal,
          id_tahun_ajaran,
          tanggal_masuk: row.tanggal_masuk || null,
          tanggal_keluar: row.tanggal_keluar || null,
          status: row.status || 'Aktif',
        };

        results.push({
          row: row.__row,
          valid,
          error: errors.length ? errors.join(', ') : null,
          payload: {
            ...payload,
            nama_santri,
            nama_kelas_mda,
            nama_kelas_formal,
            tahun_ajaran,
          },
        });
        if (mode === 'preview' || !valid) continue;

        const existing = await repository.detail({
          id_santri,
          id_tahun_ajaran,
        });

        if (existing) {
          await existing.update(
            {
              ...payload,
              updated_by: userId,
              updated_at: helper.date(),
            },
            { transaction: trx! }
          );
        } else {
          await Model.create(
            {
              ...payload,
              created_by: userId,
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
        return response.success('import kelas santri berhasil', dataRes, res);
      }

      return response.success(
        'preview import kelas santri',
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
        `import excel kelas santri: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async insert(req: Request, res: Response) {
    const payloads = req.body?.data as any[];
    const userId = req?.user?.id || '00000000-0000-0000-0000-000000000000';

    if (!Array.isArray(payloads) || payloads.length === 0) {
      return response.success('Data import kosong', null, res, false);
    }

    const trx = await sequelize.transaction();
    try {
      for (const payload of payloads) {
        const existing = await repository.detail({
          id_santri: payload.id_santri,
          id_tahun_ajaran: payload.id_tahun_ajaran,
        });

        if (existing) {
          await existing.update(
            {
              ...payload,
              updated_by: userId,
              updated_at: helper.date(),
            },
            { transaction: trx }
          );
        } else {
          await Model.create(
            {
              ...payload,
              created_by: userId,
              created_at: helper.date(),
            },
            { transaction: trx }
          );
        }
      }
      await trx.commit();

      return response.success(
        'Import batch kelas santri berhasil',
        { total: payloads.length },
        res
      );
    } catch (err: any) {
      await trx.rollback();
      return helper.catchError(`Import batch gagal: ${err.message}`, 500, res);
    }
  }
}

export const controller = new Controller();
export const penempatanKelasSantri = controller;
