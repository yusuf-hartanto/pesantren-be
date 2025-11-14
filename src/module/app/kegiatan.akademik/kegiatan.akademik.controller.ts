'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './kegiatan.akademik.variable';
import { response } from '../../../helpers/response';
import { repository } from './kegiatan.akademik.repository';
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
      return helper.catchError(
        `kegiatan akademik list: ${err?.message}`,
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
      return helper.catchError(
        `kegiatan akademik index: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({ id_kegiatan: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `kegiatan akademik detail: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const {
        nama_kegiatan,
        id_tahunajaran,
        id_semester,
        id_lembaga_formal,
        id_lembaga_pesantren,
        id_cabang,
      } = req?.body;
      const check = await repository.detail({ nama_kegiatan });
      if (check) return response.failed(ALREADY_EXIST, 400, res);
      const data: Object = helper.only(variable.fillable(), req?.body);
      await repository.create({
        payload: {
          ...data,
          id_tahunajaran: id_tahunajaran?.value || null,
          id_semester: id_semester?.value || null,
          id_lembaga_formal: id_lembaga_formal?.value || null,
          id_lembaga_pesantren: id_lembaga_pesantren?.value || null,
          id_cabang: id_cabang?.value || null,
        },
      });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `kegiatan akademik create: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_kegiatan: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      const {
        nama_kegiatan,
        id_tahunajaran,
        id_semester,
        id_lembaga_formal,
        id_lembaga_pesantren,
        id_cabang,
      } = req?.body;
      const data: Object = helper.only(variable.fillable(), req?.body, true);
      await repository.update({
        payload: {
          ...data,
          id_tahunajaran:
            id_tahunajaran?.value || check?.getDataValue('id_tahunajaran'),
          id_semester: id_semester?.value || check?.getDataValue('id_semester'),
          id_lembaga_formal:
            id_lembaga_formal?.value ||
            check?.getDataValue('id_lembaga_formal'),
          id_lembaga_pesantren:
            id_lembaga_pesantren?.value ||
            check?.getDataValue('id_lembaga_pesantren'),
          id_cabang: id_cabang?.value || check?.getDataValue('id_cabang'),
        },
        condition: { id_kegiatan: id },
      });
      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `kegiatan akademik update: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_kegiatan: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      await repository.delete({
        condition: { id_kegiatan: id },
      });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `kegiatan akademik delete: ${err?.message}`,
        500,
        res
      );
    }
  }
}

export const kegiatanAkademik = new Controller();
