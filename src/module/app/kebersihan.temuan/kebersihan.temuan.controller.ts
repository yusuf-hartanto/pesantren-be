'use strict';

import ExcelJS from 'exceljs';
import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './kebersihan.temuan.variable';
import { response } from '../../../helpers/response';
import { repository } from './kebersihan.temuan.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import moment from 'moment';
import { appConfig } from '../../../config/config.app';

const date: string = helper.date();

const generateDataExcel = (sheet: any, details: any) => {
  sheet.addRow(['No', 'Kategori', 'Deskripsi', 'Tingkat', 'Perlu Tindak Lanjut', 'Foto Path']);

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.kategori || '',
      details[i]?.deskripsi || '',
      details[i]?.tingkat || '',
      details[i]?.perlu_tindak_lanjut ? 'Ya' : 'Tidak',
      `${appConfig?.baseDomain}${details[i]?.foto_path}` || '',
    ]);
  }

  for (let row = 1; row <= details?.length + 1; row++) {
    sheet.getRow(row).eachCell((cell: any) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });
  }

  return sheet;
};

export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const id_inspeksi: any = req?.query?.id_inspeksi || '';
      const result = await repository.list({ id_inspeksi });
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`kebersihan temuan list: ${err?.message}`, 500, res);
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
      return helper.catchError(`kebersihan temuan index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({
        id_temuan: id,
      });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `kebersihan temuan detail: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const {
        id_inspeksi,
        foto_path
      } = req?.body;

      const idInspeksi = id_inspeksi?.value || null;

      const data: Object = helper.only(variable.fillable(), req?.body);

      let checkFile = helper.checkExtentionBase64(foto_path);
      if (checkFile != 'allowed') return response.failed(checkFile, 422, res);

      let fotoPath = await helper.uploadBase64(
        foto_path,
        'temuan',
        req?.user?.username,
        appConfig?.assetType
      );

      const result = await repository.create({
        payload: {
          ...data,
          id_inspeksi: idInspeksi,
          foto_path: fotoPath,
        },
      });

      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `kebersihan temuan create: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      const {
        id_inspeksi,
        foto_path
      } = req?.body;
      const idInspeksi = id_inspeksi?.value;
      const check = await repository.detail({ id_temuan: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      const data: Object = helper.only(variable.fillable(), req?.body, true);

      let fotoPath = null;
      let checkFile = helper.checkExtentionBase64(foto_path);
      if (checkFile == 'allowed') {
        fotoPath = await helper.uploadBase64(
          foto_path,
          'temuan',
          req?.user?.username,
          appConfig?.assetType
        );
      }

      await repository.update({
        payload: {
          ...data,
          id_inspeksi: idInspeksi || check?.getDataValue('id_inspeksi'),
          foto_path: fotoPath || check?.getDataValue('foto_path'),
        },
        condition: { id_temuan: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `kebersihan temuan update: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_temuan: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      
      await repository.delete({
        condition: { id_temuan: id },
      });

      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `kebersihan temuan delete: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async export(req: Request, res: Response) {
    try {
      let condition: any = {};
      const { q, template } = req?.body;
      const isTemplate: boolean = template && template == '1';

      let result: any = [];
      if (!isTemplate) {
        result = await repository.list({ id_inspeksi: q });
        if (result?.length < 1)
          return response.success(NOT_FOUND, null, res, false);
      }

      const { dir, path } = await helper.checkDirExport('excel');

      const name: string = 'kebersihan-temuan';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;
      const title: string = `${name.replace(/-/g, ' ').toUpperCase()}`;
      const urlExcel: string = `${dir}/${filename}`;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title);

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);
      return response.success('export excel kebersihan temuan', urlExcel, res);
    } catch (err: any) {
      return helper.catchError(
        `export excel kebersihan temuan: ${err?.message}`,
        500,
        res
      );
    }
  }

}

export const kebersihanTemuan = new Controller();
