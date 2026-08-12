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
  TIMEZONE,
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

const generateDataExcelPetugas = (sheet: any, details: any) => {
  sheet.addRow([
    'No',
    'Petugas',
    'Jadwal',
    'Inspeksi',
    'Tidak Inspeksi',
    'Temuan',
  ]);

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.nama_lengkap || '',
      details[i]?.total_jadwal || '',
      details[i]?.inspeksi || '',
      details[i]?.tidak_inspeksi || '',
      details[i]?.total_temuan || '',
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
      const {
        kode_slot,
        id_lokasi,
        id_petugas,
        id_cabang,
        id_jadwal,
        temuans,
        tanggal,
      } = req?.body;

      for (const temuan of temuans) {
        if (temuan.foto_path && helper.isBase64(temuan.foto_path)) {
          let checkFile = helper.checkExtentionBase64(temuan.foto_path);
          if (checkFile != 'allowed') return response.failed(checkFile, 422, res);
        }
        if (
          temuan.foto_path_tindakan &&
          helper.isBase64(temuan.foto_path_tindakan)
        ) {
          let checkFileTindakan = helper.checkExtentionBase64(
            temuan.foto_path_tindakan
          );
          if (checkFileTindakan != 'allowed')
            return response.failed(checkFileTindakan, 422, res);
        }
      }

      const idLokasi = id_lokasi?.value || null;
      const idPetugas = id_petugas?.value || null;
      const idCabang = id_cabang?.value || null;
      const idJadwal = id_jadwal?.value || null;
      const check = await repository.detail({
        tanggal,
        kode_slot,
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

      let insert = [];
      for (const temuan of temuans) {
        let foto_path: any = temuan.foto_path || null;
        if (temuan.foto_path && helper.isBase64(temuan.foto_path)) {
          foto_path = await helper.uploadBase64(
            temuan.foto_path,
            'temuan',
            req?.user?.username,
            appConfig?.assetType
          );
        }

        let foto_path_tindakan: any = temuan.foto_path_tindakan || null;
        if (
          temuan.foto_path_tindakan &&
          helper.isBase64(temuan.foto_path_tindakan)
        ) {
          foto_path_tindakan = await helper.uploadBase64(
            temuan.foto_path_tindakan,
            'tindakan',
            req?.user?.username,
            appConfig?.assetType
          );
        }

        insert.push({
          id_inspeksi: result.id_inspeksi,
          kategori: temuan.kategori,
          deskripsi: temuan.deskripsi,
          tingkat: temuan.tingkat,
          perlu_tindak_lanjut: temuan.perlu_tindak_lanjut,
          foto_path,
          foto_path_tindakan,
        });
      }

      const details = await temuanRepository.insert(insert);

      // Send notification
      if (result && result.status_kondisi === 'RUSAK') {
        const receiver = await helper.receiverByRole([
          'administrator',
          'pendidikan_kebersihan',
        ]);

        const dataMessage = {
          title: 'Inspeksi',
          message: `Kondisi Rusak.`,
          url: `/app/kebersihan-inspeksi/form?id=${result.id_inspeksi}&view=true`,
          receiver: receiver,
          type: 'Inspeksi',
        };

        helper.sendNotification(req, dataMessage);
      }

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

      const {
        kode_slot,
        id_lokasi,
        id_petugas,
        id_cabang,
        id_jadwal,
        temuans,
        tanggal,
      } = req?.body;
      const idLokasi = id_lokasi?.value;
      const idPetugas = id_petugas?.value;
      const idCabang = id_cabang?.value;
      const idJadwal = id_jadwal?.value;
      const check = await repository.detail({ id_inspeksi: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      if (
        tanggal !== check.tanggal ||
        kode_slot !== check.kode_slot ||
        idLokasi !== check.id_lokasi ||
        idPetugas !== check.id_petugas
      ) {
        const duplicate = await repository.detail({
          tanggal,
          kode_slot,
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

      for (const temuan of temuans) {
        if (temuan.foto_path && helper.isBase64(temuan.foto_path)) {
          let checkFile = helper.checkExtentionBase64(temuan.foto_path);
          if (checkFile != 'allowed') return response.failed(checkFile, 422, res);
        }
        if (
          temuan.foto_path_tindakan &&
          helper.isBase64(temuan.foto_path_tindakan)
        ) {
          let checkFileTindakan = helper.checkExtentionBase64(
            temuan.foto_path_tindakan
          );
          if (checkFileTindakan != 'allowed')
            return response.failed(checkFileTindakan, 422, res);
        }
      }

      let insert = [];
      for (const temuan of temuans) {
        let foto_path: any = temuan.foto_path || null;
        if (temuan.foto_path && helper.isBase64(temuan.foto_path)) {
          foto_path = await helper.uploadBase64(
            temuan.foto_path,
            'temuan',
            req?.user?.username,
            appConfig?.assetType
          );
        }

        let foto_path_tindakan: any = temuan.foto_path_tindakan || null;
        if (
          temuan.foto_path_tindakan &&
          helper.isBase64(temuan.foto_path_tindakan)
        ) {
          foto_path_tindakan = await helper.uploadBase64(
            temuan.foto_path_tindakan,
            'tindakan',
            req?.user?.username,
            appConfig?.assetType
          );
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
      const filename: string = `${name}-${isTemplate ? 'template' : moment().tz(TIMEZONE).format('DDMMYYYY')}.xlsx`;
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

  public async indexPetugas(req: Request, res: Response) {
    try {
      const query = {
        ...helper.fetchQueryRequest(req),
        tanggal_awal: req?.query?.tanggal_awal || '',
        tanggal_akhir: req?.query?.tanggal_akhir || '',
      };

      const { count, rows } = (await repository.indexPetugas(query)) as {
        count: number;
        rows: any[];
      };
      if (rows?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(
        SUCCESS_RETRIEVED,
        { total: count, values: rows },
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `kebersihan inspeksi index petugas: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async exportPetugas(req: Request, res: Response) {
    try {
      const query = {
        keyword: req?.body?.q || '',
        tanggal_awal: req?.body?.tanggal_awal || '',
        tanggal_akhir: req?.body?.tanggal_akhir || '',
      };

      let result: any = [];
      result = await repository.indexPetugasList(query);
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);

      const { dir, path } = await helper.checkDirExport('excel');

      const name: string = 'kebersihan-inspeksi-petugas';
      const filename: string = `${name}-${moment().tz(TIMEZONE).format('DDMMYYYY')}.xlsx`;
      const title: string = `${name.replace(/-/g, ' ').toUpperCase()}`;
      const urlExcel: string = `${dir}/${filename}`;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title);

      generateDataExcelPetugas(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);
      return response.success(
        'export excel kebersihan inspeksi petugas',
        urlExcel,
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `export excel kebersihan inspeksi petugas: ${err?.message}`,
        500,
        res
      );
    }
  }
}

export const kebersihanInspeksi = new Controller();
