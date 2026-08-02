'use strict';

import moment from 'moment';
import ExcelJS from 'exceljs';
import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { response } from '../../../helpers/response';
import { repository } from './rapot.santri.repository';
import { variable } from './rapot.santri.variable';
import Santri from '../santri/santri.model';
import { appConfig } from '../../../config/config.app';
import {
  NOT_FOUND,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
  SUCCESS_DELETED,
  TIMEZONE,
} from '../../../utils/constant';

const generateDataExcel = (sheet: any, details: any, baseUrl: string) => {
  sheet.addRow([
    'No',
    'Nama Santri',
    'NIS',
    'Cabang',
    'Kelas Formal',
    'Kelas MDA',
    'Tahun Ajaran',
    'Semester',
    'Status',
    'Rapor Formal',
    'Rapor MDA',
  ]);

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  details.forEach((row: any, i: number) => {
    const placement = (row.santri?.penempatanKelas || []).find(
      (p: any) =>
        p.tahunAjaran?.tahun_ajaran?.toLowerCase() ==
        row.tahun_ajaran?.toLowerCase()
    );
    const kelasFormalName = placement?.kelasFormal?.nama_kelas || '-';
    const kelasMdaName = placement?.kelasMda?.nama_kelas_mda || '-';

    const rowData = [
      i + 1,
      row.santri?.fullname || '-',
      row.santri?.nis || '-',
      row.santri?.cabang?.nama_cabang || '-',
      kelasFormalName,
      kelasMdaName,
      row.tahun_ajaran || '-',
      row.semester || '-',
      row.status || '-',
      '', // Rapor Formal hyperlink placeholder
      '', // Rapor MDA hyperlink placeholder
    ];

    const excelRow = sheet.addRow(rowData);

    if (row.file_rapot) {
      const fileUrl = row.file_rapot.startsWith('http')
        ? row.file_rapot
        : `${baseUrl}${row.file_rapot.startsWith('/') ? '' : '/'}${row.file_rapot}`;

      const filename = row.file_rapot.split('/').pop() || 'Rapor Formal';
      const cell = excelRow.getCell(10);
      cell.value = {
        text: filename,
        hyperlink: fileUrl,
        tooltip: 'Klik untuk mengunduh Rapor Formal',
      };
      cell.font = { color: { argb: 'FF0000FF' }, underline: true };
    } else {
      excelRow.getCell(10).value = 'Belum ada Rapor Formal';
    }

    if (row.file_rapot_mda) {
      const fileUrlMda = row.file_rapot_mda.startsWith('http')
        ? row.file_rapot_mda
        : `${baseUrl}${row.file_rapot_mda.startsWith('/') ? '' : '/'}${row.file_rapot_mda}`;

      const filenameMda = row.file_rapot_mda.split('/').pop() || 'Rapor MDA';
      const cell = excelRow.getCell(11);
      cell.value = {
        text: filenameMda,
        hyperlink: fileUrlMda,
        tooltip: 'Klik untuk mengunduh Rapor MDA',
      };
      cell.font = { color: { argb: 'FF0000FF' }, underline: true };
    } else {
      excelRow.getCell(11).value = 'Belum ada Rapor MDA';
    }
  });

  for (let r = 1; r <= details.length + 1; r++) {
    sheet.getRow(r).eachCell((cell: any) => {
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
        id_cabang: req.query.id_cabang || '',
        id_kelas: req.query.id_kelas || '',
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

      const timestamp = Date.now();
      const santriName = studentExists.fullname
        .toLowerCase()
        .replace(/\s+/g, '_');

      let file_rapot: any = null;
      if (req?.files && req?.files.file_rapot) {
        const fileFormal = req?.files?.file_rapot;
        const file = Array.isArray(fileFormal) ? fileFormal[0] : fileFormal;
        const checkFile = helper.checkExtention(file, 'file');
        if (checkFile !== 'allowed') {
          if (trx) await trx.rollback();
          return response.failed(checkFile, 422, res);
        }

        const extFormal = file.name.split('.').pop() || 'pdf';
        file.name = `${santriName}_formal_${timestamp}.${extFormal}`;

        file_rapot = await helper.upload(
          file,
          'rapot-santri',
          req?.user?.username || 'system',
          'local'
        );
      }

      let file_rapot_mda: any = null;
      if (req?.files && req?.files.file_rapot_mda) {
        const fileMdaFormal = req?.files?.file_rapot_mda;
        const fileMda = Array.isArray(fileMdaFormal)
          ? fileMdaFormal[0]
          : fileMdaFormal;
        const checkFileMda = helper.checkExtention(fileMda, 'file');
        if (checkFileMda != 'allowed') {
          if (trx) await trx.rollback();
          return response.failed(checkFileMda, 422, res);
        }

        const extMda = fileMda.name.split('.').pop() || 'pdf';
        fileMda.name = `${santriName}_mda_${timestamp}.${extMda}`;

        file_rapot_mda = await helper.upload(
          fileMda,
          'rapot-santri',
          req?.user?.username || 'system',
          'local'
        );
      }

      const creatorId = req?.user?.id || '00000000-0000-0000-0000-000000000000';

      const existingRapot = await repository.detail(
        { id_santri, tahun_ajaran, semester },
        trx
      );

      if (existingRapot) {
        const updatePayload: any = {
          updated_by: creatorId,
          status: 'Aktif',
        };

        if (file_rapot) {
          updatePayload.file_rapot = file_rapot;
        }
        if (file_rapot_mda) {
          updatePayload.file_rapot_mda = file_rapot_mda;
        }

        await existingRapot.update(updatePayload, { transaction: trx });

        if (trx) await trx.commit();
        return response.success(SUCCESS_SAVED, existingRapot, res);
      }

      await repository.archivePreviousRapots(id_santri, trx);

      const payload = {
        id_santri,
        tahun_ajaran,
        semester,
        file_rapot: file_rapot,
        file_rapot_mda: file_rapot_mda,
        status: 'Aktif',
        created_by: creatorId,
      };

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

      let fullname = check.santri?.fullname || '';
      if (!fullname) {
        const santri = await Santri.findByPk(check.id_santri, {
          transaction: trx,
        });
        if (santri) {
          fullname = santri.fullname;
        }
      }
      const timestamp = Date.now();
      const santriName = fullname.toLowerCase().replace(/\s+/g, '_');

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

        const extFormal = file.name.split('.').pop() || 'pdf';
        file.name = `${santriName}_formal_${timestamp}.${extFormal}`;

        const uploadedPath = await helper.upload(
          file,
          'rapot-santri',
          req?.user?.username || 'system',
          'local'
        );
        payload.file_rapot = uploadedPath;
      }

      if (req?.files && req?.files.file_rapot_mda) {
        const fileMdaFormal = req?.files?.file_rapot_mda;
        const fileMda = Array.isArray(fileMdaFormal)
          ? fileMdaFormal[0]
          : fileMdaFormal;
        const checkFileMda = helper.checkExtention(fileMda, 'file');
        if (checkFileMda != 'allowed') {
          if (trx) await trx.rollback();
          return response.failed(checkFileMda, 422, res);
        }

        const extMda = fileMda.name.split('.').pop() || 'pdf';
        fileMda.name = `${santriName}_mda_${timestamp}.${extMda}`;

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

  public async export(req: Request, res: Response) {
    try {
      const query = {
        id_santri: req?.body?.id_santri || req?.query?.id_santri || '',
        status: req?.body?.status || req?.query?.status || '',
        tahun: req?.body?.tahun || req?.query?.tahun || '',
        semester: req?.body?.semester || req?.query?.semester || '',
        id_cabang: req?.body?.id_cabang || req?.query?.id_cabang || '',
        id_kelas: req?.body?.id_kelas || req?.query?.id_kelas || '',
        keyword: req?.body?.keyword || req?.query?.keyword || '',
      };

      const { rows } = await repository.index(query);
      if (rows?.length < 1)
        return response.success(NOT_FOUND, null, res, false);

      const { dir, path: exportPath } = await helper.checkDirExport('excel');
      const filename = `rapor-santri-${moment().tz(TIMEZONE).format('DDMMYYYY-HHmmss')}.xlsx`;
      const title = 'RAPOR SANTRI';
      const urlExcel = `${dir}/${filename}`;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title);

      const baseUrl = appConfig.baseDomain;

      generateDataExcel(sheet, rows, baseUrl);

      await workbook.xlsx.writeFile(`${exportPath}/${filename}`);
      return response.success('export excel rapot santri', urlExcel, res);
    } catch (err: any) {
      return helper.catchError(
        `export excel rapot santri: ${err?.message}`,
        500,
        res
      );
    }
  }
}

export const controller = new Controller();
