'use strict';

import { Op } from 'sequelize';
import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './param.global.variable';
import { response } from '../../../helpers/response';
import { repository } from './param.globalrespository';

const date: string = helper.date();

export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list({
        param_key: req?.query?.param_key || null,
      });
      if (result?.length < 1)
        return response.failed('Data not found', 404, res);
      return response.success('list data param global', result, res);
    } catch (err: any) {
      return helper.catchError(`param global list: ${err?.message}`, 500, res);
    }
  }

  public async index(req: Request, res: Response) {
    try {
      const limit: any = req?.query?.perPage || 10;
      const offset: any = req?.query?.page || 1;
      const keyword: any = req?.query?.q;
      const { count, rows } = await repository.index({
        limit: parseInt(limit),
        offset: parseInt(limit) * (parseInt(offset) - 1),
        keyword: keyword,
      });
      if (rows?.length < 1) return response.failed('Data not found', 404, res);
      return response.success(
        'Data param global',
        { total: count, values: rows },
        res
      );
    } catch (err: any) {
      return helper.catchError(`param global index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const key = req.query.key || '';
      const result: Object | any = await repository.detail({
        param_key: { [Op.like]: `%${key}%` },
      });
      if (!result) return response.failed('Data not found', 404, res);
      return response.success('Data param global', result, res);
    } catch (err: any) {
      return helper.catchError(
        `param global detail: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const check = await repository.detail({
        param_key: req?.body?.param_key,
      });
      if (check) return response.failed('Data already exists', 400, res);
      const data: Object = helper.only(variable.fillable(), req?.body);
      await repository.create({
        payload: { ...data, created_by: req?.user?.id },
      });
      return response.success('Data success saved', null, res);
    } catch (err: any) {
      return helper.catchError(
        `param global create: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      if (!helper.isValidUUID(id))
        return response.failed(`id ${id} is not valid`, 400, res);

      const check = await repository.detail({ id: id });
      if (!check) return response.failed('Data not found', 404, res);
      const data: Object = helper.only(variable.fillable(), req?.body, true);
      await repository.update({
        payload: { ...data, modified_by: req?.user?.id },
        condition: { id: id },
      });
      return response.success('Data success updated', null, res);
    } catch (err: any) {
      return helper.catchError(
        `param global update: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      if (!helper.isValidUUID(id))
        return response.failed(`id ${id} is not valid`, 400, res);

      const check = await repository.detail({ id: id });
      if (!check) return response.failed('Data not found', 404, res);
      await repository.update({
        payload: {
          status: 9,
          modified_by: req?.user?.id,
          modified_date: date,
        },
        condition: { id: id },
      });
      return response.success('Data success deleted', null, res);
    } catch (err: any) {
      return helper.catchError(
        `param global delete: ${err?.message}`,
        500,
        res
      );
    }
  }
}
export const paramGlobal = new Controller();
