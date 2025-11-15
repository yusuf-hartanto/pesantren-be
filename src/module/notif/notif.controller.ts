'use strict';

import { Request, Response } from 'express';
import { helper } from '../../helpers/helper';
import { repository } from './notif.respository';
import { response } from '../../helpers/response';
import {
  NOT_FOUND,
  SUCCESS_RETRIEVED,
  SUCCESS_UPDATED,
} from '../../utils/constant';

export default class Controller {
  public async index(req: Request, res: Response) {
    try {
      // const query = helper.fetchQueryRequest(req);
      // const type: any = req?.query?.type || 0;
      // let condition: any = {};
      // if (['1', '2'].includes(type)) {
      //   condition = { status: type };
      // }
      // const { count, rows } = await repository.index({ ...query, ...condition });
      // if (rows?.length < 1)
      // return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, { total: 0, values: [] }, res);
    } catch (err: any) {
      return helper.catchError(`notif index: ${err?.message}`, 500, res);
    }
  }

  public async read(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({
        id: id,
        resource_id: req?.user?.id,
      });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      await repository.update({
        payload: { status: 1 },
        condition: { id: id },
      });
      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(`notif update: ${err?.message}`, 500, res);
    }
  }
}
export const notif = new Controller();
