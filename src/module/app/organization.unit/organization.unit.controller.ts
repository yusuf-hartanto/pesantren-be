'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './organization.unit.variable';
import { response } from '../../../helpers/response';
import { repository } from './organization.unit.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import { orgUnitSchema } from './oraganization.unit.schema';
import z from 'zod';

const date: string = helper.date();
const ALLOWED_ROLES_FOR_LEMBAGA = ['administrator', 'superadmin', 'admin_pusat', 'kepala_biro'];

export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list({});
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `organization unit list: ${err?.message}`,
        500,
        res
      );
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
      return helper.catchError(`tingkat index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({ id_orgunit: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`tingkat detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const user = (req as any).user; // Ambil data user dari request
      const body = req.body;
      const payloadArray = Array.isArray(body) ? body : [body];
      const validatedData = [];

      for (const item of payloadArray) {
        // 1. Validasi Schema (Zod)
        const validItem = orgUnitSchema.parse(item);

        // 2. VALIDASI ROLE: Cek jika jenis_orgunit adalah 'Lembaga'
        if (validItem.jenis_orgunit === 'Lembaga') {
          if (!user || !ALLOWED_ROLES_FOR_LEMBAGA.includes(user.role_name)) {
            return helper.catchError(
              `Akses Ditolak: Role '${user?.role_name || 'Guest'}' tidak memiliki izin untuk membuat unit jenis 'Lembaga'`,
              403,
              res
            );
          }
        }

        // 3. Otomatisasi Level
        let level = 0;
        if (validItem.parent_id) {
          const parent: any = await repository.detail({ id_orgunit: validItem.parent_id });
          if (parent) level = (parent.level_orgunit || 0) + 1;
        }

        const cleanItem = helper.only(variable.fillable(), { ...validItem, level_orgunit: level });
        validatedData.push(cleanItem);
      }

      await repository.create({ payload: validatedData });
      return response.success(SUCCESS_SAVED, null, res);

    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;
      if (err instanceof z.ZodError) {
        errorMessage = `Field [${err.issues[0].path.join('.')}]: ${err.issues[0].message}`;
        errorCode = 400;
      }
      return helper.catchError(`OrgUnit create: ${errorMessage}`, errorCode, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      const user = (req as any).user; // Ambil data user dari request

      const check = await repository.detail({ id_orgunit: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // 1. Validasi Partial Update (Zod)
      const validData = orgUnitSchema.partial().parse(req.body);

      // 2. VALIDASI ROLE: Cek jika mencoba mengubah jenis_orgunit menjadi 'Lembaga'
      if (validData.jenis_orgunit === 'Lembaga') {
        if (!user || !ALLOWED_ROLES_FOR_LEMBAGA.includes(user.role_name)) {
          return helper.catchError(
            `Akses Ditolak: Anda tidak memiliki izin untuk menetapkan unit sebagai 'Lembaga'`,
            403,
            res
          );
        }
      }

      // 3. Re-kalkulasi level jika parent_id berubah
      if (validData.parent_id !== undefined) {
        let newLevel = 0;
        if (validData.parent_id) {
          const parent: any = await repository.detail({ id_orgunit: validData.parent_id });
          newLevel = (parent?.level_orgunit || 0) + 1;
        }
        (validData as any).level_orgunit = newLevel;
      }

      const dataToUpdate = helper.only(variable.fillable(), validData, true);
      await repository.update({
        payload: dataToUpdate,
        condition: { id_orgunit: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);

    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;
      if (err instanceof z.ZodError) {
        errorMessage = `Field [${err.issues[0].path.join('.')}]: ${err.issues[0].message}`;
        errorCode = 400;
      }
      return helper.catchError(`OrgUnit update: ${errorMessage}`, errorCode, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      
      // Proteksi hierarki
      const hasChildren = await repository.checkHasChildren(id);
      if (hasChildren) {
        return helper.catchError("Unit gagal dihapus: Masih memiliki sub-unit di bawahnya.", 400, res);
      }

      const check = await repository.detail({ id_orgunit: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      await repository.delete({ condition: { id_orgunit: id } });
      return response.success(SUCCESS_DELETED, null, res);

    } catch (err: any) {
      return helper.catchError(`OrgUnit delete: ${err?.message}`, 500, res);
    }
  }
}

export const OrganizationUnit = new Controller();
