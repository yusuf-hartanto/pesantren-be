'use strict';

import { variable } from './policy.variable';
import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { repository } from './policy.respository';
import { response } from '../../../helpers/response';

export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list();
      if (result?.length < 1)
        return response.failed('Data not found', 404, res);
      return response.success('list data menu', result, res);
    } catch (err: any) {
      return helper.catchError(`menu all-data: ${err?.message}`, 500, res);
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
      return response.success('Data menu', { total: count, values: rows }, res);
    } catch (err: any) {
      return helper.catchError(`menu index: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const check = await repository.detail({
        menu_name: req?.body?.menu_name,
      });
      if (check) return response.failed('Data already exists', 400, res);
      const data: Object = helper.only(variable.fillable(), req?.body);
      await repository.create({
        payload: {
          ...data,
          module_name: req?.body?.module_name.replace(/ /g, ''),
          created_by: req?.user?.id,
        },
      });
      return response.success('Data success saved', null, res);
    } catch (err: any) {
      return helper.catchError(`menu create: ${err?.message}`, 500, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      if (!helper.isValidUUID(id))
        return response.failed(`id ${id} is not valid`, 400, res);

      const check = await repository.detail({ menu_id: id });
      if (!check) return response.failed('Data not found', 404, res);
      const data: Object = helper.only(variable.fillable(), req?.body, true);
      await repository.update({
        payload: {
          ...data,
          module_name: req?.body?.module_name.replace(/ /g, ''),
          modified_by: req?.user?.id,
        },
        condition: { menu_id: id },
      });
      return response.success('Data success updated', null, res);
    } catch (err: any) {
      return helper.catchError(`menu update: ${err?.message}`, 500, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      if (!helper.isValidUUID(id))
        return response.failed(`id ${id} is not valid`, 400, res);

      const date: string = helper.date();
      const check = await repository.detail({ menu_id: id });
      if (!check) return response.failed('Data not found', 404, res);
      await repository.update({
        payload: {
          status: 9,
          modified_by: req?.user?.id,
          modified_date: date,
        },
        condition: { menu_id: id },
      });
      return response.success('Data success deleted', null, res);
    } catch (err: any) {
      return helper.catchError(`menu delete: ${err?.message}`, 500, res);
    }
  }
}
export const menu = new Controller();
