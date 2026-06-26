'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { response } from '../../../helpers/response';
import { repository } from './rapot.santri.repository';
import { variable } from './rapot.santri.variable';
import Santri from '../santri/santri.model';
import {
  NOT_FOUND,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
  SUCCESS_DELETED,
} from '../../../utils/constant';

export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const idSantri: any = req?.query?.id_santri || '';
      const status: any = req?.query?.status || '';
      const result = await repository.list({ id_santri: idSantri, status });
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`rapot santri list: ${err?.message}`, 500, res);
    }
  }

  public async index(req: Request, res: Response) {
    try {
      const query = {
        ...helper.fetchQueryRequest(req),
        id_santri: req?.query?.id_santri || '',
        status: req?.query?.status || '',
        tahun: req.query.tahun || '',
        semester: req.query.semester || '',
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
      return helper.catchError(`rapot santri index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result = await repository.detail({ id_rapot: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `rapot santri detail: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async create(req: Request, res: Response) {
    const trx = await Santri.sequelize?.transaction();
    try {
      let file_rapot: any = null;
      if (req?.files && req?.files.file_rapot) {
        const fileFormal = req?.files?.file_rapot;
        const file = Array.isArray(fileFormal) ? fileFormal[0] : fileFormal;
        const checkFile = helper.checkExtention(file, 'file');
        if (checkFile !== 'allowed') {
          if (trx) await trx.rollback();
          return response.failed(checkFile, 422, res);
        }

        file_rapot = await helper.upload(
          file,
          'rapot-santri',
          req?.user?.username || 'system',
          'local'
        );
      }

      let file_rapot_mda: any = null;
      if (req?.files && req?.files.file_rapot_mda) {
        const fileMda = req?.files?.file_rapot_mda;
        const checkFileMda = helper.checkExtention(fileMda, 'file');
        if (checkFileMda != 'allowed')
          return response.failed(checkFileMda, 422, res);

        file_rapot_mda = await helper.upload(
          fileMda,
          'rapot-santri',
          req?.user?.username || 'system',
          'local'
        );
      }

      const { id_santri, tahun_ajaran, semester } = req.body;
      if (!id_santri) {
        if (trx) await trx.rollback();
        return response.failed('id_santri is required', 422, res);
      }
      if (!tahun_ajaran) {
        if (trx) await trx.rollback();
        return response.failed('tahun_ajaran is required', 422, res);
      }
      if (!semester) {
        if (trx) await trx.rollback();
        return response.failed('semester is required', 422, res);
      }

      const studentExists = await Santri.findByPk(id_santri, {
        transaction: trx,
      });
      if (!studentExists) {
        if (trx) await trx.rollback();
        return response.failed('Santri not found', 404, res);
      }

      await repository.archivePreviousRapots(id_santri, trx);

      const creatorId = req?.user?.id || '00000000-0000-0000-0000-000000000000';
      const payload = {
        id_santri,
        tahun_ajaran,
        semester,
        file_rapot: file_rapot,
        file_rapot_mda: file_rapot_mda,
        status: 'Aktif',
        created_by: creatorId,
      };

      await repository.archivePreviousRapots(id_santri, trx);
      const result = await repository.create({ payload }, trx);

      if (trx) await trx.commit();
      return response.success(SUCCESS_SAVED, result, res);
    } catch (err: any) {
      if (trx) await trx.rollback();
      return helper.catchError(
        `rapot santri create: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async update(req: Request, res: Response) {
    const trx = await Santri.sequelize?.transaction();
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_rapot: id });
      if (!check) {
        if (trx) await trx.rollback();
        return response.success(NOT_FOUND, null, res, false);
      }

      let payload: any = helper.only(variable.fillable(), req.body, true);

      let fileDelete: string[] = [];
      if (req.body.file_delete) {
        if (Array.isArray(req.body.file_delete)) {
          fileDelete = req.body.file_delete;
        } else if (typeof req.body.file_delete == 'string') {
          try {
            if (req.body.file_delete.startsWith('[')) {
              fileDelete = JSON.parse(req.body.file_delete);
            } else {
              fileDelete = [req.body.file_delete];
            }
          } catch (e) {
            fileDelete = [req.body.file_delete];
          }
        }
      }

      fileDelete.forEach((fieldKey) => {
        if (fieldKey == 'file_rapot') {
          payload.file_rapot = '';
        } else if (fieldKey == 'file_rapot_mda') {
          payload.file_rapot_mda = null;
        }
      });

      if (req.files?.file_rapot) {
        const uploadedFile = req.files.file_rapot;
        const file = Array.isArray(uploadedFile)
          ? uploadedFile[0]
          : uploadedFile;
        const checkFile = helper.checkExtention(file, 'file');
        if (checkFile !== 'allowed') {
          if (trx) await trx.rollback();
          return response.failed(checkFile, 422, res);
        }

        const uploadedPath = await helper.upload(
          file,
          'rapot-santri',
          req?.user?.username || 'system',
          'local'
        );
        payload.file_rapot = uploadedPath;
      }

      if (req?.files && req?.files.file_rapot_mda) {
        const fileMda = req?.files?.file_rapot_mda;
        const checkFileMda = helper.checkExtention(fileMda, 'file');
        if (checkFileMda != 'allowed')
          return response.failed(checkFileMda, 422, res);

        payload.file_rapot_mda = await helper.upload(
          fileMda,
          'rapot-santri',
          req?.user?.username || 'system',
          'local'
        );
      }

      if (payload.status === 'Aktif' && check.status !== 'Aktif') {
        await repository.archivePreviousRapots(check.id_santri, trx);
      }

      payload.updated_by =
        req?.user?.id || '00000000-0000-0000-0000-000000000000';

      await repository.update(
        {
          payload,
          condition: { id_rapot: id },
        },
        trx
      );

      if (trx) await trx.commit();
      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      if (trx) await trx.rollback();
      return helper.catchError(
        `rapot santri update: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_rapot: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      await repository.delete({
        condition: { id_rapot: id },
      });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `rapot santri delete: ${err?.message}`,
        500,
        res
      );
    }
  }
}

export const controller = new Controller();
