'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './notification.variable';
import { response } from '../../../helpers/response';
import { repository } from './notification.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import moment from 'moment';
import { rawQuery } from '../../../helpers/rawQuery';
import { QueryTypes } from 'sequelize';

const date: string = helper.date();

export default class Controller {
  public async index(req: Request, res: Response) {
    try {
      const query = {
        ...helper.fetchQueryRequest(req),
        resource_id: req.user?.id
      };
      const { count, rows } = await repository.index(query);
      const q = `SELECT COUNT(*) FROM notifications WHERE status = 0 AND "to" = :resource_id`;
      const conn = await rawQuery.getConnection();
      const result: any =await conn.query(q, {
        type: QueryTypes.SELECT,
        replacements: {
          resource_id: req.user?.id
        }
      });

      if (rows?.length < 1) return response.success(NOT_FOUND, null, res, false);
      return response.success(
        SUCCESS_RETRIEVED,
        { total: count, values: rows, total_new: parseInt(result[0]?.count) },
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `notifications index: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      const check = await repository.detail({ id_notification: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      const data: Object = helper.only(variable.fillable(), req?.body, true);

      await repository.update({
        payload: {
          ...data,
        },
        condition: { id_notification: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `notifications update: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_notification: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      await repository.delete({
        condition: { id_notification: id },
      });

      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `notifications delete: ${err?.message}`,
        500,
        res
      );
    }
  }
}

export const notification = new Controller();
