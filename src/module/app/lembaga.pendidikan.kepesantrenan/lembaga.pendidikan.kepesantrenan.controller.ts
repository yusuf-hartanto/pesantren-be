'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './lembaga.pendidikan.kepesantrenan.variable';
import { response } from '../../../helpers/response';
import { repository } from './lembaga.pendidikan.kepesantrenan.repository';
import {
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import { Op } from 'sequelize';
import { lembagaSchema } from './lembaga.pendidikan.kepesantrenan.schema';
import z from 'zod';

export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list({});
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`LP Kepesantrenan list: ${err?.message}`, 500, res);
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
      return helper.catchError(`LP Kepesantrenan index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: any = await repository.detail({ id_lembaga: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`LP Kepesantrenan detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      // 1. Validasi Schema menggunakan Zod (mendukung Array/Bulk atau Single Object)
      const payload = Array.isArray(req.body) 
        ? z.array(lembagaSchema).parse(req.body) 
        : [lembagaSchema.parse(req.body)];

      const finalData = [];

      for (const item of payload) {
        // 2. Validasi ID Cabang (Referensial)
        const cabangExist = await repository.checkCabangExists(item.id_cabang);
        if (!cabangExist) throw new Error(`Cabang dengan ID tersebut tidak ditemukan.`);

        // 3. Cek Duplikasi (Kombinasi id_cabang + nama_lembaga)
        const isDuplicate = await repository.detail({
          id_cabang: item.id_cabang,
          nama_lembaga: item.nama_lembaga,
        });

        if (isDuplicate) throw new Error(`Lembaga "${item.nama_lembaga}" sudah terdaftar di cabang ini.`);
        
        finalData.push(item);
      }
        
      await repository.create({ payload: finalData });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;

      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        const fieldName = firstIssue.path.join('.'); 
        errorMessage = `Field [${fieldName}]: ${firstIssue.message}`;
        errorCode = 400;
      }

      return helper.catchError(`LP Kepesantrenan create: ${errorMessage}`, errorCode, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      // 1. Ambil data lama
      const existingData: any = await repository.detail({ id_lembaga: id });
      if (!existingData) return response.success(NOT_FOUND, null, res, false);

      // 2. Validasi input (menggunakan schema yang sama atau partial)
      const validatedData = lembagaSchema.parse(req.body);

      // 3. Gabungkan data untuk pengecekan logika bisnis
      const mergedData = { ...existingData.get({ plain: true }), ...validatedData };

      // 4. Validasi ID Cabang jika diubah
      if (validatedData?.id_cabang) {
        const cabangExist = await repository.checkCabangExists(validatedData?.id_cabang);
        if (!cabangExist) throw new Error(`Cabang tidak ditemukan.`);
      }

      // 5. Check duplicate (Kombinasi nama + cabang, kecuali dirinya sendiri)
      const isDuplicate = await repository.detail({
        id_cabang: mergedData.id_cabang,
        nama_lembaga: mergedData.nama_lembaga,
        id_lembaga: { [Op.ne]: id }
      });

      if (isDuplicate) {
        throw new Error(`Nama lembaga "${mergedData.nama_lembaga}" sudah digunakan di cabang ini.`);
      }

      // 6. Eksekusi Update
      await repository.update({
        payload: helper.only(variable.fillable(), mergedData, true), 
        condition: { id_lembaga: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;

      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        const fieldName = firstIssue.path.join('.'); 
        errorMessage = `Field [${fieldName}]: ${firstIssue.message}`;
        errorCode = 400;
      }

      return helper.catchError(`LP Kepesantrenan update: ${errorMessage}`, errorCode, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      // 1. Cek eksistensi
      const check = await repository.detail({ id_lembaga: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // 2. Eksekusi penghapusan (Soft Delete otomatis karena model paranoid)
      await repository.delete({
        condition: { id_lembaga: id },
      });

      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`LP Kepesantrenan delete: ${err?.message}`, 500, res);
    }
  }
}

export const LembagaPendidikanKepesantrenan = new Controller();