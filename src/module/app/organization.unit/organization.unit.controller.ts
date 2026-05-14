'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './organization.unit.variable';
import { response } from '../../../helpers/response';
import { repository } from './organization.unit.repository';
import { repository as cabangRepo } from '../cabang/cabang.repository';
import { repository as formalRepo } from '../lembaga.pendidikan.formal/lembaga.pendidikan.formal.repository';
import { repository as pesantrenRepo } from '../lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import { orgUnitSchema } from './oraganization.unit.schema';
import z from 'zod';
import moment from 'moment';
import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import { Op } from 'sequelize';

const date: string = helper.date();
const ALLOWED_ROLES_FOR_LEMBAGA = [
  'administrator',
  'superadmin',
  'admin_pusat',
  'kepala_biro',
];

const generateDataExcel = (sheet: any, details: any) => {
  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Nama Unit', key: 'nama_orgunit', width: 30 },
    // { header: 'Level', key: 'level_orgunit', width: 10 },
    { header: 'Jenis Unit', key: 'jenis_orgunit', width: 15 },
    { header: 'Nama Parent', key: 'parent', width: 30 },
    { header: 'Cabang', key: 'cabang', width: 25 },
    { header: 'Tipe Lembaga', key: 'lembaga_type', width: 15 },
    { header: 'Nama Lembaga', key: 'nama_lembaga', width: 30 },
    { header: 'Keterangan', key: 'keterangan', width: 40 },
  ];

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    const item = details[i];
    const namaLembaga =
      item.lembagaPendidikanFormal?.nama_lembaga ||
      item.lembagaPendidikanKepesantrenan?.nama_lembaga ||
      '';

    sheet.addRow({
      no: parseInt(i) + 1,
      nama_orgunit: item.nama_orgunit || '',
      // level_orgunit: item.level_orgunit ?? 0, // Ambil level dari database
      jenis_orgunit: item.jenis_orgunit || '',
      parent: item.parent?.nama_orgunit || '',
      cabang: item.cabang?.nama_cabang || '',
      lembaga_type: item.lembaga_type || '',
      nama_lembaga: namaLembaga,
      keterangan: item.keterangan || '',
    });
  }

  return sheet;
};

const normalizeRow = (row: any) => ({
  nama_orgunit: String(row['Nama Unit'] || '').trim(),
  jenis_orgunit: String(row['Jenis Unit'] || '').trim(),
  nama_parent: String(row['Nama Parent'] || '').trim(),
  nama_cabang: String(row['Cabang'] || '').trim(),
  lembaga_type: String(row['Tipe Lembaga'] || '')
    .toUpperCase()
    .trim(),
  nama_lembaga: String(row['Nama Lembaga'] || '').trim(),
  keterangan: String(row['Keterangan'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];
  if (!row.nama_orgunit) errors.push('Nama Unit wajib diisi');
  if (!row.nama_cabang) errors.push('Cabang wajib diisi');

  const validJenis = ['Biro', 'Bagian', 'Lembaga', 'Sub-Unit', 'Umum'];
  if (!validJenis.includes(row.jenis_orgunit))
    errors.push('Jenis Unit tidak valid');

  if (row.lembaga_type && !['FORMAL', 'PESANTREN'].includes(row.lembaga_type)) {
    errors.push('Tipe Lembaga harus FORMAL atau PESANTREN');
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
        `organization unit list: ${err?.message}`,
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
      return helper.catchError(`tingkat index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({ id_orgunit: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`tingkat detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const user = (req as any).user; // Ambil data user dari request
      const body = req.body;
      const payloadArray = Array.isArray(body) ? body : [body];
      const validatedData = [];

      for (const item of payloadArray) {
        const validItem = orgUnitSchema.parse(item);

        if (validItem.jenis_orgunit === 'Lembaga') {
          if (!user || !ALLOWED_ROLES_FOR_LEMBAGA.includes(user.role_name)) {
            return helper.catchError(
              `Akses Ditolak: Role '${user?.role_name || 'Guest'}' tidak memiliki izin untuk membuat unit jenis 'Lembaga'`,
              403,
              res
            );
          }
        }

        let level = 0;
        if (validItem.parent_id) {
          const parent: any = await repository.detail({
            id_orgunit: validItem.parent_id,
          });
          if (parent) level = (parent.level_orgunit || 0) + 1;
        }

        const cleanItem = helper.only(variable.fillable(), {
          ...validItem,
          level_orgunit: level,
        });
        validatedData.push(cleanItem);
      }

      await repository.create({ payload: validatedData });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;
      if (err instanceof z.ZodError) {
        errorMessage = `Field [${err.issues[0].path.join('.')}]: ${err.issues[0].message}`;
        errorCode = 400;
      }
      return helper.catchError(
        `OrgUnit create: ${errorMessage}`,
        errorCode,
        res
      );
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      const user = (req as any).user; // Ambil data user dari request

      const check = await repository.detail({ id_orgunit: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // 1. Validasi Partial Update (Zod)
      const validData = orgUnitSchema.partial().parse(req.body);

      // 2. VALIDASI ROLE: Cek jika mencoba mengubah jenis_orgunit menjadi 'Lembaga'
      if (validData.jenis_orgunit === 'Lembaga') {
        if (!user || !ALLOWED_ROLES_FOR_LEMBAGA.includes(user.role_name)) {
          return helper.catchError(
            `Akses Ditolak: Anda tidak memiliki izin untuk menetapkan unit sebagai 'Lembaga'`,
            403,
            res
          );
        }
      }

      // 3. Re-kalkulasi level jika parent_id berubah
      if (validData.parent_id !== undefined) {
        let newLevel = 0;
        if (validData.parent_id) {
          const parent: any = await repository.detail({
            id_orgunit: validData.parent_id,
          });
          newLevel = (parent?.level_orgunit || 0) + 1;
        }
        (validData as any).level_orgunit = newLevel;
      }

      const dataToUpdate = helper.only(variable.fillable(), validData, true);
      await repository.update({
        payload: dataToUpdate,
        condition: { id_orgunit: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;
      if (err instanceof z.ZodError) {
        errorMessage = `Field [${err.issues[0].path.join('.')}]: ${err.issues[0].message}`;
        errorCode = 400;
      }
      return helper.catchError(
        `OrgUnit update: ${errorMessage}`,
        errorCode,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';

      // Proteksi hierarki
      const hasChildren = await repository.checkHasChildren(id);
      if (hasChildren) {
        return helper.catchError(
          'Unit gagal dihapus: Masih memiliki sub-unit di bawahnya.',
          400,
          res
        );
      }

      const check = await repository.detail({ id_orgunit: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      await repository.delete({ condition: { id_orgunit: id } });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`OrgUnit delete: ${err?.message}`, 500, res);
    }
  }

  public async export(req: Request, res: Response) {
    try {
      const { q, template } = req.body;
      const isTemplate: boolean = template && template == '1';

      let result = await repository.listForExport({ q, isTemplate });

      const { dir, path } = await helper.checkDirExport('excel');

      const name: string = 'organization-unit';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().format('DDMMYYYY-HHmmss')}.xlsx`;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('ORGANIZATION UNIT');

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success('Export berhasil', `${dir}/${filename}`, res);
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  }

  public async import(req: Request, res: Response) {
    const mode: 'preview' | 'commit' = req.body?.mode ?? 'preview';
    const uploaded = req.files?.file_import;
    if (!uploaded)
      return response.success('File tidak ditemukan', null, res, false);

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

        let id_cabang = null,
          id_lembaga = null,
          parent_id = null,
          level = 0;

        // Resolve Cabang
        const cabang = await cabangRepo.findByName(row.nama_cabang);
        if (cabang) id_cabang = cabang.id_cabang;
        else errors.push(`Cabang "${row.nama_cabang}" tidak ditemukan`);

        // Resolve Lembaga (Formal vs Pesantren)
        if (id_cabang && row.nama_lembaga && row.lembaga_type) {
          const repo =
            row.lembaga_type === 'FORMAL' ? formalRepo : pesantrenRepo;
          const lembaga = await repo.findByName(row.nama_lembaga);
          if (lembaga) id_lembaga = lembaga.id_lembaga;
          else
            errors.push(
              `Lembaga ${row.lembaga_type} "${row.nama_lembaga}" tidak ditemukan`
            );
        }

        // Resolve Parent & Level
        if (id_cabang && row.nama_parent) {
          const parent = await repository.findByName(
            row.nama_parent,
            id_cabang,
            id_lembaga,
            row.lembaga_type
          );

          if (parent) {
            parent_id = parent.id_orgunit;
            level = (parent.level_orgunit || 0) + 1;
          } else {
            // Pesan error lebih informatif
            const suffix = row.nama_lembaga
              ? ` di lembaga ${row.nama_lembaga}`
              : '';
            errors.push(
              `Induk Unit "${row.nama_parent}" tidak ditemukan pada cabang${suffix}`
            );
          }
        }

        const payload = {
          nama_orgunit: row.nama_orgunit,
          jenis_orgunit: row.jenis_orgunit,
          parent_id,
          level_orgunit: level,
          id_cabang,
          id_lembaga,
          lembaga_type: row.lembaga_type || null,
          keterangan: row.keterangan,
        };

        results.push({
          row: row.__row,
          valid: errors.length === 0,
          error: errors.join(', ') || null,
          payload,
        });
      }

      const dataRes = {
        mode,
        total: results.length,
        valid: results.filter((r) => r.valid).length,
        invalid: results.filter((r) => !r.valid).length,
      };

      if (mode === 'commit') {
        const validData = results.filter((r) => r.valid).map((r) => r.payload);
        await repository.insertImport(validData);
        return response.success('import berhasil', dataRes, res);
      }

      return response.success(
        'preview import',
        { ...dataRes, data: results },
        res
      );
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  }

  public insert = async (req: Request, res: Response) => {
    const payloads = req.body?.data as any[];

    if (!payloads || !Array.isArray(payloads) || payloads.length === 0) {
      return response.success(
        'Tidak ada data untuk diproses',
        null,
        res,
        false
      );
    }

    try {
      await repository.insertImport(payloads);

      return response.success(
        'Import batch Organization Unit berhasil',
        { count: payloads.length },
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `Import batch OrgUnit gagal: ${err.message}`,
        500,
        res
      );
    }
  };
}

export const OrganizationUnit = new Controller();
