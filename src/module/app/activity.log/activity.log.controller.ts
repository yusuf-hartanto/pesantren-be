'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { response } from '../../../helpers/response';
import { repository } from './activity.log.repository';
import { NOT_FOUND, SUCCESS_RETRIEVED } from '../../../utils/constant';

export default class Controller {
  public async index(req: Request, res: Response) {
    try {
      const query = {
        ...helper.fetchQueryRequest(req),
        table_name: req.query.table_name,
        action: req.query.action,
        tanggal_awal: req.query.tanggal_awal || req.query.tanggal_mulai,
        tanggal_akhir: req.query.tanggal_akhir || req.query.tanggal_selesai,
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
      return helper.catchError(`activity log index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      return response.success(SUCCESS_RETRIEVED, check, res);
    } catch (err: any) {
      return helper.catchError(
        `activity log detail: ${err?.message}`,
        500,
        res
      );
    }
  }
}

export const activityLog = new Controller();
