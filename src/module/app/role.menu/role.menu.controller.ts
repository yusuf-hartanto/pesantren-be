'use strict';

import { Op } from 'sequelize';
import { Request, Response } from 'express';
import { response } from '../../../helpers/response';
import { helper } from '../../../helpers/helper';
import { repository } from './role.menu.respository';
import { transformer } from './role.menu.transformer';

export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list();
      if (result?.length < 1)
        return response.failed('Data not found', 404, res);
      const roleMenu = transformer.list(result);
      return response.success('list data role', roleMenu, res);
    } catch (err: any) {
      return helper.catchError(`role menu all-data: ${err?.message}`, 500, res);
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
      const roleMenu = transformer.list(rows);
      const total: any = count;
      return response.success(
        'Data role menu',
        { total: total?.length, values: roleMenu },
        res
      );
    } catch (err: any) {
      return helper.catchError(`role menu index: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      interface Menu {
        menu_id: string;
        create: number;
        edit: number;
        delete: number;
        approve: number;
        status: string;
      }
      const date: string = helper.date();
      const body: Array<{ role_id: any; menu: Array<Menu> }> = req?.body;
      if (body?.length === 0)
        return response.failed('request body is required', 422, res);

      let insert: Array<object> = [];
      let role_id: Array<number> = [];
      body.forEach(async (item) => {
        role_id.push(item?.role_id?.value);

        item?.menu.forEach((i) => {
          insert.push({
            role_id: item?.role_id?.value,
            menu_id: i?.menu_id,
            create: i?.create,
            edit: i?.edit,
            delete: i?.delete,
            approve: i?.approve,
            status: i?.status,
            created_by: req?.user?.id,
            created_date: date,
          });
        });
      });
      if (insert?.length > 0) {
        await repository.delete({
          condition: { role_id: { [Op.in]: role_id } },
        });
        await repository.bulkCreate({
          payload: insert,
        });
      }

      return response.success('Data success saved', null, res);
    } catch (err: any) {
      return helper.catchError(`role menu create: ${err?.message}`, 500, res);
    }
  }
}
export const roleMenu = new Controller();
