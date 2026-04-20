'use strict';

import ExcelJS from 'exceljs';
import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './kebersihan.scan.log.variable';
import { response } from '../../../helpers/response';
import { repository } from './kebersihan.scan.log.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import moment from 'moment';

const date: string = helper.date();

const generateDataExcel = (sheet: any, details: any) => {
  sheet.addRow(['No', 'Lokasi', 'Petugas', 'QR Code', 'Scan Latitude', 'Scan Longitude', 'Jarak Meter', 'Valid QR', 'Valid Geo', 'Metode Scan', 'Scan Source', 'User Agent', 'IP Address', 'Scan At', 'Keterangan']);

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.lokasi?.nama_lokasi || '',
      details[i]?.pegawai?.nama_lengkap || '',
      details[i]?.qr_code || '',
      details[i]?.scan_latitude || '',
      details[i]?.scan_longitude || '',
      details[i]?.jarak_meter || '',
      details[i]?.valid_qr ? 'Ya' : 'Tidak',
      details[i]?.valid_geo ? 'Ya' : 'Tidak',
      details[i]?.metode_scan || '',
      details[i]?.scan_source || '',
      details[i]?.user_agent || '',
      details[i]?.ip_address || '',
      details[i]?.scan_at || '',
      details[i]?.keterangan || '',
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
      const id_scan_log: any = req?.query?.id_scan_log || '';
      const result = await repository.list({ id_scan_log });
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`kebersihan scan log list: ${err?.message}`, 500, res);
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
      return helper.catchError(`kebersihan scan log index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({
        id_scan_log: id,
      });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `kebersihan scan log detail: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const {
        id_inspeksi,
        id_petugas,
        id_lokasi,
        id_geo,
      } = req?.body;

      const idInspeksi = id_inspeksi?.value || null;
      const idPetugas = id_petugas?.value || null;
      const idLokasi = id_lokasi?.value || null;
      const idGeo = id_geo?.value || null;

      const data: Object = helper.only(variable.fillable(), req?.body);
      const result = await repository.create({
        payload: {
          ...data,
          id_lokasi: idLokasi,
          id_geo: idGeo,
          id_inspeksi: idInspeksi,
          id_petugas: idPetugas,
        },
      });

      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `kebersihan scan log create: ${err?.message}`,
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
        id_petugas,
        id_lokasi,
        id_geo,
      } = req?.body;
      const idInspeksi = id_inspeksi?.value;
      const idPetugas = id_petugas?.value;
      const idLokasi = id_lokasi?.value;
      const idGeo = id_geo?.value;
      const check = await repository.detail({ id_scan_log: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      const data: Object = helper.only(variable.fillable(), req?.body, true);

      await repository.update({
        payload: {
          ...data,
          id_petugas:
            idPetugas || check?.getDataValue('id_petugas'),
          id_lokasi: idLokasi || check?.getDataValue('id_lokasi'),
          id_geo: idGeo || check?.getDataValue('id_geo'),
          id_inspeksi: idInspeksi || check?.getDataValue('id_inspeksi'),
        },
        condition: { id_scan_log: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `kebersihan scan log update: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_scan_log: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      
      await repository.delete({
        condition: { id_scan_log: id },
      });

      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `kebersihan scan log delete: ${err?.message}`,
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
        result = await repository.list({ id_scan_log: q });
        if (result?.length < 1)
          return response.success(NOT_FOUND, null, res, false);
      }

      const { dir, path } = await helper.checkDirExport('excel');

      const name: string = 'kebersihan-scan-log';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;
      const title: string = `${name.replace(/-/g, ' ').toUpperCase()}`;
      const urlExcel: string = `${dir}/${filename}`;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title);

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);
      return response.success('export excel kebersihan scan log', urlExcel, res);
    } catch (err: any) {
      return helper.catchError(
        `export excel kebersihan scan log: ${err?.message}`,
        500,
        res
      );
    }
  }

}

export const kebersihanScanLog = new Controller();
