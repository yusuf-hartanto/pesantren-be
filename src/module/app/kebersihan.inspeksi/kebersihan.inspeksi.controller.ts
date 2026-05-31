'use strict';

import ExcelJS from 'exceljs';
import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './kebersihan.inspeksi.variable';
import { response } from '../../../helpers/response';
import { repository } from './kebersihan.inspeksi.repository';
import { repository as temuanRepository } from '../kebersihan.temuan/kebersihan.temuan.repository';
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
  sheet.addRow([
    'No',
    'Cabang',
    'Lokasi',
    'Petugas',
    'Tanggal',
    'Waktu',
    'Kode Slot',
    'Status Kondisi',
    'Catatan Umum',
  ]);

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.cabang?.nama_cabang || '',
      details[i]?.lokasi?.nama_lokasi || '',
      details[i]?.pegawai?.nama_lengkap || '',
      details[i]?.tanggal || '',
      details[i]?.waktu || '',
      details[i]?.kode_slot || '',
      details[i]?.status_kondisi || '',
      details[i]?.catatan_umum || '',
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
      const kode_slot: any = req?.query?.kode_slot || '';
      const result = await repository.list({ kode_slot });
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `kebersihan inspeksi list: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async index(req: Request, res: Response) {
    try {
      const query = {
        ...helper.fetchQueryRequest(req),
        status: req?.query?.status || '',
        id_cabang: req?.query?.id_cabang || '',
        id_lokasi: req?.query?.id_lokasi || '',
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
      return helper.catchError(
        `kebersihan inspeksi index: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({
        id_inspeksi: id,
      });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `kebersihan inspeksi detail: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const { waktu, id_lokasi, id_petugas, id_cabang, id_jadwal, temuans } =
        req?.body;

      const idLokasi = id_lokasi?.value || null;
      const idPetugas = id_petugas?.value || null;
      const idCabang = id_cabang?.value || null;
      const idJadwal = id_jadwal?.value || null;
      const check = await repository.detail({
        waktu,
        id_lokasi: idLokasi,
        id_petugas: idPetugas,
      });

      if (check) return response.failed(ALREADY_EXIST, 400, res);
      const data: Object = helper.only(variable.fillable(), req?.body);
      const result = await repository.create({
        payload: {
          ...data,
          id_cabang: idCabang,
          id_jadwal: idJadwal,
          id_lokasi: idLokasi,
          id_petugas: idPetugas,
        },
      });

      let foto_path: any = null;
      let insert = [];
      for (const temuan of temuans) {
        let checkFile = helper.checkExtentionBase64(temuan.foto_path);
        if (checkFile != 'allowed') return response.failed(checkFile, 422, res);

        foto_path = await helper.uploadBase64(
          temuan.foto_path,
          'temuan',
          req?.user?.username,
          appConfig?.assetType
        );

        insert.push({
          id_inspeksi: result.id_inspeksi,
          kategori: temuan.kategori,
          deskripsi: temuan.deskripsi,
          tingkat: temuan.tingkat,
          perlu_tindak_lanjut: temuan.perlu_tindak_lanjut,
          foto_path,
        });
      }

      const details = await temuanRepository.insert(insert);

      return response.success(SUCCESS_SAVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `kebersihan inspeksi create: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      const { waktu, id_lokasi, id_petugas, id_cabang, id_jadwal, temuans } =
        req?.body;
      const idLokasi = id_lokasi?.value;
      const idPetugas = id_petugas?.value;
      const idCabang = id_cabang?.value;
      const idJadwal = id_jadwal?.value;
      const check = await repository.detail({ id_inspeksi: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      const waktuArr = check.waktu.split(':');

      if (
        waktu !== `${waktuArr[0]}:${waktuArr[1]}` ||
        idLokasi !== check.id_lokasi ||
        idPetugas !== check.id_petugas
      ) {
        const duplicate = await repository.detail({
          waktu,
          id_lokasi: idLokasi,
          id_petugas: idPetugas,
        });

        if (duplicate) {
          return response.failed(ALREADY_EXIST, 400, res);
        }
      }
      const data: Object = helper.only(variable.fillable(), req?.body, true);

      await repository.update({
        payload: {
          ...data,
          id_petugas: idPetugas || check?.getDataValue('id_petugas'),
          id_cabang: idCabang || check?.getDataValue('id_cabang'),
          id_jadwal: idJadwal || check?.getDataValue('id_jadwal'),
          id_lokasi: idLokasi || check?.getDataValue('id_lokasi'),
        },
        condition: { id_inspeksi: id },
      });

      // delete all temuan
      await temuanRepository.delete({
        condition: { id_inspeksi: id },
      });

      let foto_path: any = null;
      let foto_path_tindakan: any = null;
      let insert = [];
      for (const temuan of temuans) {
        let checkFile = helper.checkExtentionBase64(temuan.foto_path);
        if (checkFile == 'allowed') {
          foto_path = await helper.uploadBase64(
            temuan.foto_path,
            'temuan',
            req?.user?.username,
            appConfig?.assetType
          );
        } else {
          foto_path = temuan.foto_path;
        }

        let checkFileTindakan = helper.checkExtentionBase64(temuan.foto_path_tindakan);
        if (checkFileTindakan == 'allowed') {
          foto_path_tindakan = await helper.uploadBase64(
            temuan.foto_path_tindakan,
            'temuan',
            req?.user?.username,
            appConfig?.assetType
          );
        } else {
          foto_path_tindakan = temuan.foto_path_tindakan;
        }

        insert.push({
          id_inspeksi: id,
          kategori: temuan.kategori,
          deskripsi: temuan.deskripsi,
          tingkat: temuan.tingkat,
          perlu_tindak_lanjut: temuan.perlu_tindak_lanjut,
          foto_path,
          foto_path_tindakan,
          status: temuan.status,
        });
      }

      const details = await temuanRepository.insert(insert);

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `kebersihan inspeksi update: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_inspeksi: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // delete all temuan
      await temuanRepository.delete({
        condition: { id_inspeksi: id },
      });

      await repository.delete({
        condition: { id_inspeksi: id },
      });

      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `kebersihan inspeksi delete: ${err?.message}`,
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
        result = await repository.list({ kode_slot: q });
        if (result?.length < 1)
          return response.success(NOT_FOUND, null, res, false);
      }

      const { dir, path } = await helper.checkDirExport('excel');

      const name: string = 'kebersihan-inspeksi';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;
      const title: string = `${name.replace(/-/g, ' ').toUpperCase()}`;
      const urlExcel: string = `${dir}/${filename}`;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title);

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);
      return response.success(
        'export excel kebersihan inspeksi',
        urlExcel,
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `export excel kebersihan inspeksi: ${err?.message}`,
        500,
        res
      );
    }
  }
}

export const kebersihanInspeksi = new Controller();
