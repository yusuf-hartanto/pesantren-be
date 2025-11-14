'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './jam.pelajaran.variable';
import { response } from '../../../helpers/response';
import { repository } from './jam.pelajaran.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';

const date: string = helper.date();

export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list({});
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`jam pelajaran list: ${err?.message}`, 500, res);
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
        `jam pelajaran index: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({ id_jampel: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `jam pelajaran detail: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const { id_jenisjam, id_lembaga, nama_jampel, mulai, selesai } =
        req?.body;
      const check = await repository.detail({ nama_jampel });
      if (check) return response.failed(ALREADY_EXIST, 400, res);
      const data: Object = helper.only(variable.fillable(), req?.body);
      const jumlah_jampel: number = helper.calDurationTime(mulai, selesai);
      await repository.create({
        payload: {
          ...data,
          jumlah_jampel,
          id_jenisjam: id_jenisjam?.value || null,
          id_lembaga: id_lembaga?.value || null,
        },
      });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `jam pelajaran create: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_jampel: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      const { id_jenisjam, id_lembaga, mulai, selesai } = req?.body;
      const data: Object = helper.only(variable.fillable(), req?.body, true);
      const jumlah_jampel: number = helper.calDurationTime(mulai, selesai);
      await repository.update({
        payload: {
          ...data,
          jumlah_jampel,
          id_jenisjam: id_jenisjam?.value || check?.getDataValue('id_jenisjam'),
          id_lembaga: id_lembaga?.value || check?.getDataValue('id_lembaga'),
          updated_at: helper.date(),
        },
        condition: { id_jampel: id },
      });
      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `jam pelajaran update: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_jampel: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      await repository.delete({
        condition: { id_jampel: id },
      });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `jam pelajaran delete: ${err?.message}`,
        500,
        res
      );
    }
  }
}

export const jamPelajaran = new Controller();
