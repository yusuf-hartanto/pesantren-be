'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './lembaga.pendidikan.formal.variable';
import { response } from '../../../helpers/response';
import { repository } from './lembaga.pendidikan.formal.repository';
import {
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import { Op } from 'sequelize';
import { lembagaFormalSchema } from './lembaga.pendidikan.formal.schema';
import z from 'zod';

export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list({});
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`LP Formal list: ${err?.message}`, 500, res);
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
      return helper.catchError(`LP Formal index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: any = await repository.detail({ id_lembaga: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`LP Formal detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      // 1. Validasi Schema (Bulk atau Single)
      const payload = Array.isArray(req.body) 
        ? z.array(lembagaFormalSchema).parse(req.body) 
        : [lembagaFormalSchema.parse(req.body)];

      const finalData = [];

      for (const item of payload) {
        // 2. Validasi Relasi Cabang
        if (item.id_cabang) {
          const cabangExist = await repository.checkCabangExists(item.id_cabang);
          if (!cabangExist) throw new Error(`Cabang dengan ID "${item.id_cabang}" tidak ditemukan.`);
        }

        // 3. Cek Duplikasi (Nama + NPSN)
        const isDuplicate = await repository.detail({
          [Op.or]: [
            { nama_lembaga: item.nama_lembaga },
            { nomor_npsn: item.nomor_npsn ? item.nomor_npsn : 'DUMMY_NONE' }
          ]
        });

        if (isDuplicate) {
           const reason = isDuplicate.nama_lembaga === item.nama_lembaga ? 'Nama' : 'NPSN';
           throw new Error(`${reason} lembaga sudah terdaftar di cabang ini.`);
        }
        
        finalData.push(item);
      }
        
      await repository.create({ payload: finalData });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;

      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        errorMessage = `Field [${firstIssue.path.join('.')}]: ${firstIssue.message}`;
        errorCode = 400;
      }

      return helper.catchError(`LP Formal create: ${errorMessage}`, errorCode, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      const existingData: any = await repository.detail({ id_lembaga: id });
      if (!existingData) return response.success(NOT_FOUND, null, res, false);

      // Validasi partial schema (zod)
      const validatedData = lembagaFormalSchema.parse(req.body);
      const mergedData = { ...existingData.get({ plain: true }), ...validatedData };

      // Cek duplikasi kecuali dirinya sendiri
      const isDuplicate = await repository.detail({
        [Op.or]: [
          { nama_lembaga: mergedData.nama_lembaga },
          { nomor_npsn: mergedData.nomor_npsn ? mergedData.nomor_npsn : 'DUMMY_NONE' }
        ],
        // id_cabang: mergedData.id_cabang || null,
        id_lembaga: { [Op.ne]: id }
      });

      if (isDuplicate) throw new Error(`Data sudah digunakan oleh lembaga formal lain.`);

      await repository.update({
        payload: helper.only(variable.fillable(), mergedData, true), 
        condition: { id_lembaga: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;

      if (err instanceof z.ZodError) {
        errorMessage = `Field [${err.issues[0].path.join('.')}]: ${err.issues[0].message}`;
        errorCode = 400;
      }

      return helper.catchError(`LP Formal update: ${errorMessage}`, errorCode, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      const check = await repository.detail({ id_lembaga: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      await repository.delete({
        condition: { id_lembaga: id },
      });

      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`LP Formal delete: ${err?.message}`, 500, res);
    }
  }
}

export const LembagaPendidikanFormal = new Controller();