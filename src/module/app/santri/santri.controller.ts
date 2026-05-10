'use strict';

import moment from 'moment';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import { Op } from 'sequelize';
import AppRole from './santri.model';
import { variable } from './santri.variable';
import { Request, Response } from 'express';
import { repository } from './santri.repository';
import { helper } from '../../../helpers/helper';
import { response } from '../../../helpers/response';
import { sequelize } from '../../../database/connection';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';

const date: string = helper.date();

const generateDataExcel = (sheet: any, details: any) => {
  sheet.addRow([
    'No',
    'Nama Santri',
    'Nama Wali',
    'NIS',
    'NIK',
    'Jenis Kelamin',
    'No. Hp',
    'Lembaga',
    'Kelas',
    'No. Rekening',
    'Kartu Santri',
    'Status',
  ]);

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    let gender = '';
    if (details[i]?.gender && details[i]?.gender == 'L') gender = 'Laki-Laki';
    else if (details[i]?.gender && details[i]?.gender == 'P') gender = 'Perempuan';

    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.fullname || '',
      details[i]?.wali?.nama_wali || '',
      details[i]?.nis || '',
      details[i]?.nik || '',
      gender,
      details[i]?.phone || '',
      details[i]?.institution_name || '',
      details[i]?.group_code_1 || '',
      details[i]?.nomor_rekening || '',
      details[i]?.kartu_santri || '',
      details[i]?.status == 1 ? 'Aktif' : 'Nonaktif',
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
      const result = await repository.list();
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`santri all-data: ${err?.message}`, 500, res);
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
      return helper.catchError(`santri index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({ id_santri: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`santri detail: ${err?.message}`, 500, res);
    }
  }

  public async export(req: Request, res: Response) {
    try {
      let condition: any = {};
      const { q, template } = req?.body;
      const isTemplate: boolean = template && template == '1';
      if (q) {
        condition = {
          ...condition,
          fullname: { [Op.like]: `%${q}%` },
        };
      }

      let result: any = [];
      if (!isTemplate) {
        result = await repository.list(condition);
        if (result?.length < 1)
          return response.success(NOT_FOUND, null, res, false);
      }

      const { dir, path } = await helper.checkDirExport('excel');

      const name: string = 'santri';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;
      const title: string = `${name.replace(/-/g, ' ').toUpperCase()}`;
      const urlExcel: string = `${dir}/${filename}`;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title);

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);
      return response.success('export excel santri', urlExcel, res);
    } catch (err: any) {
      return helper.catchError(`export excel santri: ${err?.message}`, 500, res);
    }
  }
}

export const santri = new Controller();
