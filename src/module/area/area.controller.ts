'use strict';

import { Request, Response } from 'express';
import { helper } from '../../helpers/helper';
import { repository } from './area.repository';
import { response } from '../../helpers/response';
import { INVALID, NOT_FOUND, SUCCESS_RETRIEVED } from '../../utils/constant';

export default class Controller {
  public async province(req: Request, res: Response) {
    try {
      const result = await repository.province();
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`province: ${err?.message}`, 500, res);
    }
  }

  public async allRegency(req: Request, res: Response) {
    try {
      const limit: any = req?.query?.perPage || 10;
      const offset: any = req?.query?.page || 1;
      const keyword: any = req?.query?.q;
      const { count, rows } = await repository.indexRegency({
        limit: parseInt(limit),
        offset: parseInt(limit) * (parseInt(offset) - 1),
        keyword: keyword,
      });
      if (rows?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(
        SUCCESS_RETRIEVED,
        { total: count, values: rows },
        res
      );
    } catch (err: any) {
      return helper.catchError(`regency index: ${err?.message}`, 500, res);
    }
  }

  public async regency(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      if (!helper.isValidUUID(id))
        return response.failed(`id ${id} ${INVALID}`, 400, res);

      const result = await repository.regency({
        area_province_id: id,
      });
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`regency: ${err?.message}`, 500, res);
    }
  }
}

export const area = new Controller();
