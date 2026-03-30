'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './jenis.penilaian.bobot.variable';
import { response } from '../../../helpers/response';
import { repository } from './jenis.penilaian.bobot.repository';
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

const date: string = helper.date();

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
      if (!check || check.length === 0) return response.success(NOT_FOUND, null, res, false);

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
}

export const JenisPenilaianBobot = new Controller();
