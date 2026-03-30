'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './jenis.penilaian.variable';
import { response } from '../../../helpers/response';
import { repository } from './jenis.penilaian.repository';
import { jenisPenilaianSchema } from './jenis.penilaian.schema';
import { z } from 'zod';
import {
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';

export default class Controller {
  constructor() {
    // Binding Private Methods
    this.validateBusinessLogic = this.validateBusinessLogic.bind(this);

    // Binding Public Methods (API Handlers)
    this.list = this.list.bind(this);
    this.index = this.index.bind(this);
    this.detail = this.detail.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }
  
  private async validateBusinessLogic(item: any, id_penilaian?: string) {
    // Validasi Unik: jenis_pengujian per lembaga_type
    const isExist = await repository.checkDuplicate(
      item.jenis_pengujian, 
      item.lembaga_type, 
      id_penilaian
    );
    
    if (isExist) {
      throw new Error(`Jenis pengujian '${item.jenis_pengujian}' sudah terdaftar untuk lembaga ${item.lembaga_type}`);
    }

    return item;
  }

  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list(req.query);
      if (result?.length < 1) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`Jenis Penilaian list: ${err?.message}`, 500, res);
    }
  }

  public async index(req: Request, res: Response) {
    try {
      const query = helper.fetchQueryRequest(req);
      const { count, rows } = await repository.index(query);
      if (rows?.length < 1) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, { total: count, values: rows }, res);
    } catch (err: any) {
      return helper.catchError(`Jenis Penilaian index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await repository.detail({ id_penilaian: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`Jenis Penilaian detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const body = req.body;
      const payloadArray = Array.isArray(body) ? body : [body];
      const validatedData = [];

      for (const item of payloadArray) {
        // 1. Zod Validation
        const validItem = jenisPenilaianSchema.parse(item);
        
        // 2. Business Logic Validation (Unique Constraint)
        await this.validateBusinessLogic(validItem);
        
        // 3. Filter Fillable
        validatedData.push(helper.only(variable.fillable(), validItem));
      }

      await repository.create({ payload: validatedData });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      const msg = err instanceof z.ZodError ? err.issues[0].message : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const check: any = await repository.detail({ id_penilaian: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // 1. Zod Partial Validation
      const validData = jenisPenilaianSchema.partial().parse(req.body);

      // 2. Business Logic Validation (Merge existing with new data to check unique)
      const mergedData = { ...check.toJSON(), ...validData };
      await this.validateBusinessLogic(mergedData, id);

      const payload = helper.only(variable.fillable(), validData, true);
      await repository.update({
        payload: { ...payload, updated_at: new Date() },
        condition: { id_penilaian: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      const msg = err instanceof z.ZodError ? err.issues[0].message : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const check = await repository.detail({ id_penilaian: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      await repository.delete({ condition: { id_penilaian: id } });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`Jenis Penilaian delete: ${err?.message}`, 500, res);
    }
  }
}

export const JenisPenilaian = new Controller();