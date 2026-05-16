'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './jenis.penilaian.bobot.variable';
import { response } from '../../../helpers/response';
import { repository } from './jenis.penilaian.bobot.repository';
import { repository as penilaianRepo } from '../jenis.penilaian/jenis.penilaian.repository';
import { repository as formalRepo } from '../lembaga.pendidikan.formal/lembaga.pendidikan.formal.repository';
import { repository as pesantrenRepo } from '../lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.repository';
import { repository as tingkatRepo } from '../tingkat/tingkat.repository';
import { repository as tahunRepo } from '../tahun.ajaran/tahun.ajaran.repository';

import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import { updateExistingBobot, validateBobot } from './validation';
import { bobotSchema } from './jenis.penilaian.bobot.schema';
import moment from 'moment';
import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import { Op } from 'sequelize';
import z from 'zod';

const date: string = helper.date();

const generateDataExcel = (sheet: any, details: any) => {
  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Jenis Penilaian', key: 'penilaian', width: 25 },
    { header: 'Tipe Lembaga', key: 'tipe', width: 15 },
    { header: 'Nama Lembaga', key: 'nama_lembaga', width: 30 },
    { header: 'Tingkat', key: 'tingkat', width: 15 },
    { header: 'Tahun Ajaran', key: 'ta', width: 15 },
    { header: 'Bobot (%)', key: 'bobot', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
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

  for (let i in details) {
    const item = details[i];

    // Pola Organization Unit: Cek relasi mana yang memiliki data
    const namaLembaga =
      item.lembagaPendidikanFormal?.nama_lembaga ||
      item.lembagaPendidikanKepesantrenan?.nama_lembaga ||
      '';

    sheet.addRow({
      no: parseInt(i) + 1,
      penilaian: item.jenisPenilaian?.jenis_pengujian || '',
      tipe: item.lembaga_type || '',
      nama_lembaga: namaLembaga,
      tingkat: item.tingkat?.tingkat || '',
      ta: item.tahunAjaran?.tahun_ajaran || '',
      bobot: item.bobot || 0,
      status: item.status || '',
    });
  }

  // Border styling
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
  nama_penilaian: String(row['Jenis Penilaian'] || '').trim(),
  lembaga_type: String(row['Tipe Lembaga'] || '')
    .toUpperCase()
    .trim(),
  nama_lembaga: String(row['Nama Lembaga'] || '').trim(),
  nama_tingkat: String(row['Tingkat'] || '').trim(),
  tahun_ajaran: String(row['Tahun Ajaran'] || '').trim(),
  bobot: parseFloat(row['Bobot (%)']) || 0,
  status: String(row['Status'] || 'Aktif').trim(),
  __row: row.__row,
});
export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list({});
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`list: ${err?.message}`, 500, res);
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
      return helper.catchError(`index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({
        id_bobot: id,
      });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const body = req.body;
      const dataArray = Array.isArray(body) ? body : [body];
      const validatedPayload = [];

      for (const item of dataArray) {
        // A. Validasi Schema (Zod)
        const validData = bobotSchema.parse(item);

        // B. Validasi Business Logic (Unique & Total Bobot)
        await repository.validateBobotLogic(validData);

        validatedPayload.push(helper.only(variable.fillable(), validData));
      }

      await repository.create({ payload: validatedPayload });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      return helper.catchError(err?.message, 400, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      const check: any = await repository.detail({ id_bobot: id });
      if (!check || check.length === 0)
        return response.success(NOT_FOUND, null, res, false);

      // A. Validasi Schema (Partial update)
      const validData = bobotSchema.partial().parse(req.body);

      // B. Merge data lama dengan data baru untuk divalidasi
      // Karena repository.detail Anda mengembalikan raw query (array), ambil index 0
      const mergedData = { ...check[0], ...validData };

      await repository.validateBobotLogic(mergedData, id);

      const payload = helper.only(variable.fillable(), validData, true);
      await repository.update({
        payload: payload,
        condition: { id_bobot: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(err?.message, 400, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_bobot: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      await repository.delete({
        condition: { id_bobot: id },
      });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`Delete: ${err?.message}`, 500, res);
    }
  }

  public async export(req: Request, res: Response) {
    try {
      const { template } = req.body;
      const isTemplate = template == '1';

      const result = await repository.listForExport(
        {},
        isTemplate ? 5 : undefined
      );

      const { dir, path } = await helper.checkDirExport('excel');
      const filename = `bobot-penilaian-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('BOBOT PENILAIAN');

      // Gunakan await karena generateDataExcel sekarang async untuk fetch nama lembaga
      await generateDataExcel(sheet, result);

      await workbook.xlsx.writeFile(`${path}/${filename}`);
      return response.success('export excel', `${dir}/${filename}`, res);
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
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
        let errors: string[] = [];
        let id_penilaian = null,
          id_lembaga = null,
          id_tingkat = null,
          id_tahunajaran = null;

        try {
          // jenisPenilaianBobotSchema.parse(row);

          // Resolve Jenis Penilaian
          const penilaian = await penilaianRepo.findByName(row.nama_penilaian);
          if (penilaian) id_penilaian = penilaian.id_penilaian;
          else
            errors.push(
              `Jenis Penilaian "${row.nama_penilaian}" tidak ditemukan`
            );

          // Resolve Lembaga (Pilih Repo sesuai Tipe)
          if (row.nama_lembaga && row.lembaga_type) {
            const repo =
              row.lembaga_type === 'FORMAL' ? formalRepo : pesantrenRepo;
            const lembaga = await repo.findByName(row.nama_lembaga);
            if (lembaga) id_lembaga = lembaga.id_lembaga;
            else
              errors.push(
                `Lembaga ${row.lembaga_type} "${row.nama_lembaga}" tidak ditemukan`
              );
          } else {
            errors.push('Tipe & Nama Lembaga wajib diisi');
          }

          // Resolve Tingkat (Optional)
          if (row.nama_tingkat) {
            const tingkat = await tingkatRepo.detail({
              nama_tingkat: row.nama_tingkat,
            });
            if (tingkat) id_tingkat = tingkat.id_tingkat;
            else errors.push(`Tingkat "${row.nama_tingkat}" tidak ditemukan`);
          }

          // Resolve Tahun Ajaran
          const ta = await tahunRepo.detail({ tahun_ajaran: row.tahun_ajaran });
          if (ta) id_tahunajaran = ta.id_tahunajaran;
          else
            errors.push(`Tahun Ajaran "${row.tahun_ajaran}" tidak ditemukan`);

          // Business Logic: Cek Duplikasi (Kombinasi Unik)
          if (id_penilaian && id_lembaga && id_tahunajaran) {
            const payloadCheck = {
              id_penilaian,
              id_lembaga,
              id_tingkat,
              id_tahunajaran,
              lembaga_type: row.lembaga_type,
            };
            const isExist = await repository.checkDuplicate(payloadCheck);

            // Jika mode commit, ini akan di-update (Upsert),
            // namun di preview kita beri info jika data sudah ada
            if (isExist && mode === 'preview') {
              // Opsional: beri tanda bahwa ini akan mengupdate data lama
            }
          }
        } catch (err: any) {
          const msg =
            err instanceof z.ZodError ? err.issues[0].message : err.message;
          errors.push(msg);
        }

        const valid = errors.length === 0;
        const payload = {
          id_penilaian,
          id_lembaga,
          id_tingkat,
          id_tahunajaran,
          lembaga_type: row.lembaga_type,
          bobot: row.bobot,
          status: row.status,
        };

        results.push({
          row: row.__row,
          valid,
          error: errors.length ? errors.join(', ') : null,
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
          'Import bobot berhasil',
          { total: validPayloads.length },
          res
        );
      }

      return response.success(
        'Preview Import Bobot',
        { total: results.length, data: results },
        res
      );
    } catch (err: any) {
      return helper.catchError(`Import error: ${err.message}`, 500, res);
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
      return helper.catchError(err.message, 500, res);
    }
  };
}

export const JenisPenilaianBobot = new Controller();
