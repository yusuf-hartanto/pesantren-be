'use strict';

import ExcelJS from 'exceljs';
import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './guru.pengganti.variable';
import { response } from '../../../helpers/response';
import { repository } from './guru.pengganti.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import moment from 'moment';
import { guruPenggantiSchema } from './guru.pengganti.schema';
import { repository as jamPelajaranRepository } from '../jam.pelajaran/jam.pelajaran.repository';
import { repository as lembagaFormalRepository } from '../lembaga.pendidikan.formal/lembaga.pendidikan.formal.repository';
import { repository as lembagaKepesantrenanRepository } from '../lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.repository';
import { repository as jadwalPelajaranRepository } from '../jadwal.pelajaran/jadwal.pelajaran.repository';
import { repository as guruRepository } from '../pegawai/pegawai.repository';
import { repository as kelasFormalRepository } from '../kelas.formal/kelas.formal.repository';
import { repository as kelasMdaRepository } from '../kelas.mda/kelas.mda.repository';
import { sequelize } from '../../../database/connection';
import fs from 'fs/promises';
import GuruPengganti from './guru.pengganti.model';

const date: string = helper.date();

const generateDataExcel = (sheet: any, details: any) => {
  sheet.addRow([
    'No',
    'Jadwal Pelajaran',
    'Tanggal',
    'Guru Asli',
    'Guru Pengganti',
    'Alasan',
    'Status Approval'
  ]);

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1,
        `${details[i]?.jadwal_pelajaran?.hari} / ${details[i]?.jadwal_pelajaran?.jam_pelajaran?.mulai?.slice(0, -3)} - ${details[i]?.jadwal_pelajaran?.jam_pelajaran?.selesai?.slice(0, -3)} / ${details[i]?.jadwal_pelajaran?.kelas_formal ? details[i]?.jadwal_pelajaran?.kelas_formal?.nama_kelas : details[i]?.jadwal_pelajaran?.kelas_mda?.nama_kelas_mda} (${details[i]?.jadwal_pelajaran?.kelas_formal ? details[i]?.jadwal_pelajaran?.kelas_formal?.lembaga?.nama_lembaga : details[i]?.jadwal_pelajaran?.kelas_mda?.lembaga?.nama_lembaga})`,
      details[i]?.tanggal || '',
      details[i]?.guru_asli?.nama_lengkap || '',
      details[i]?.guru_pengganti?.nama_lengkap || '',
      details[i]?.alasan || '',
      details[i]?.status_approval,
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

const normalizeRow = (row: any) => ({
  jadwal: String(row['Jadwal Pelajaran'] || '').trim(),
  tanggal: String(row['Tanggal'] || '').trim(),
  guru_asli: String(row['Guru Asli'] || '').trim(),
  guru_pengganti: String(row['Guru Pengganti'] || '').trim(),
  alasan: String(row['Alasan'] || '').trim(),
  status_approval: String(row['Status Approval'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];
  const valid = guruPenggantiSchema.safeParse(row);

  if (!valid.success) {
    for (const e of valid.error.issues) {
      errors.push(e.message);
    }
  }

  return errors;
};

export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const status: any = req?.query?.status || '';
      const result = await repository.list({ status });
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `guru pengganti list: ${err?.message}`,
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
        `guru pengganti index: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({
        id_pengganti: id,
      });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `guru pengganti detail: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const {
        tanggal,
        id_jadwal,
        id_guru_asli,
        id_guru_pengganti,
      } = req?.body;

      const idJadwal = id_jadwal?.value || null;
      const idGuruAsli = id_guru_asli?.value || null;
      const idGuruPengganti = id_guru_pengganti?.value || null;

      const check = await repository.detail({
        tanggal,
        id_jadwal: idJadwal,
      });

      if (check) return response.failed(ALREADY_EXIST, 400, res);
      const data: Object = helper.only(variable.fillable(), req?.body);
      const result = await repository.create({
        payload: {
          ...data,
          id_guru_pengganti: idGuruPengganti,
          id_jadwal: idJadwal,
          id_guru_asli: idGuruAsli,
          created_by: req.user?.id
        },
      });

      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `guru pengganti create: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const {
        tanggal,
        id_jadwal,
        id_guru_asli,
        id_guru_pengganti,
        status_approval
      } = req?.body;
      const idJadwal = id_jadwal?.value;
      const idGuruAsli = id_guru_asli?.value;
      const idGuruPengganti = id_guru_pengganti?.value;
      
      const check = await repository.detail({ id_pengganti: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      if (
        tanggal !== check.tanggal ||
        idJadwal !== check.id_jadwal
      ) {
        const duplicate = await repository.detail({
          tanggal,
          id_jadwal: idJadwal,
        });

        if (duplicate) {
          return response.failed(ALREADY_EXIST, 400, res);
        }
      }
      const data: Object = helper.only(variable.fillable(), req?.body, true);

      let approved: any = {};
      if (status_approval == 'Disetujui') {
        approved = {
          approved_by: req.user?.id,
          approved_at: helper.date()
        }
      }

      await repository.update({
        payload: {
          ...data,
          id_jadwal:
            idJadwal || check?.getDataValue('id_jadwal'),
          id_guru_asli: idGuruAsli || check?.getDataValue('id_guru_asli'),
          id_guru_pengganti:
            idGuruPengganti || check?.getDataValue('id_guru_pengganti'),
          ...approved
        },
        condition: { id_pengganti: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `guru pengganti update: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_pengganti: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      await repository.delete({
        condition: { id_pengganti: id },
      });
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `guru pengganti delete: ${err?.message}`,
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
        result = await repository.list({ status: q });
        if (result?.length < 1)
          return response.success(NOT_FOUND, null, res, false);
      }

      const { dir, path } = await helper.checkDirExport('excel');

      const name: string = 'guru-pengganti';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;
      const title: string = `${name.replace(/-/g, ' ').toUpperCase()}`;
      const urlExcel: string = `${dir}/${filename}`;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title);

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);
      return response.success('export excel guru pengganti', urlExcel, res);
    } catch (err: any) {
      return helper.catchError(
        `export excel guru pengganti: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async import(req: Request, res: Response) {
    const mode: 'preview' | 'commit' = req.body?.mode ?? 'preview';
    const uploaded = req.files?.file_import;

    if (!uploaded) {
      return response.success('File tidak valid', null, res, false);
    }

    const trx = mode === 'commit' ? await sequelize.transaction() : null;

    try {
      let buffer: Buffer;
      const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      if (file.tempFilePath) {
        buffer = await fs.readFile(file.tempFilePath);
      } else if (file.data) {
        buffer = file.data;
      } else {
        return response.success(
          'File kosong atau gagal dibaca',
          null,
          res,
          false
        );
      }

      const results: any[] = [];
      const rows = await helper.parseImportFile({
        name: file.name,
        data: buffer,
      });

      let data = null;
      for (const raw of rows) {
        const row = normalizeRow(raw);
        const errors = validateRow(row);

        const jadwal = row.jadwal;
        const tanggal = row.tanggal;
        const guru_asli = row.guru_asli;
        const guru_pengganti = row.guru_pengganti;
        const jadwalArr = jadwal.split(' / ');
        const hari = jadwalArr[0];
        const jam = jadwalArr[1].split(' - ');
        const jamMulai = jam[0];
        const jamSelesai = jam[1];
        const kelas = jadwalArr[2].split('(');
        const kelasName = kelas[0].trim();
        const nama_lembaga = kelas[1].replace(')', '');

        let idLembaga = null;
        let typeLembaga = null;
        const lembagaFormalExist = await lembagaFormalRepository.detail({
          nama_lembaga,
        });

        if (!lembagaFormalExist) {
          const lembagaKepesantrenanExist =
            await lembagaKepesantrenanRepository.detail({ nama_lembaga });

          if (!lembagaKepesantrenanExist) {
            errors.push(`Lembaga ${nama_lembaga} tidak ditemukan`);
          } else {
            idLembaga = lembagaKepesantrenanExist?.id_lembaga;
            typeLembaga = 'PESANTREN';
          }
        } else {
          idLembaga = lembagaFormalExist?.id_lembaga;
          typeLembaga = 'FORMAL';
        }

        const jamPelajaranExist = await jamPelajaranRepository.detail({
          mulai: jamMulai,
          selesai: jamSelesai,
          id_lembaga: idLembaga || '',
        });
        if (!jamPelajaranExist) {
          errors.push(
            `Jam Pelajaran ${jamMulai} - ${jamSelesai} tidak ditemukan`
          );
        }

        const guruAsliExist = await guruRepository.detail({ nama_lengkap: guru_asli });
        const guruPenggantiExist = await guruRepository.detail({ nama_lengkap: guru_pengganti });

        if (!guruAsliExist) {
          errors.push(`Guru Asli tidak ditemukan`);
        }

        if (!guruPenggantiExist) {
          errors.push(`Guru Pengganti tidak ditemukan`);
        }

        let idKelas = null;
        if (typeLembaga == 'FORMAL') {
          const kelasFormalExist = await kelasFormalRepository.detail({
            nama_kelas: kelasName
          });

          if (!kelasFormalExist) {
            errors.push(`Kelas ${kelasName} tidak ditemukan`);
          } else {
            idKelas = kelasFormalExist?.id_kelas;
          }
        } else {
          const kelasMdaExist = await kelasMdaRepository.detail({
            nama_kelas_mda: kelasName
          });
          if (!kelasMdaExist) {
            errors.push(`Kelas ${kelasName} tidak ditemukan`);
          } else {
            idKelas = kelasMdaExist?.id_kelas_mda;
          }
        }

        const jadwalExist = await jadwalPelajaranRepository.detail({ 
          hari,
          id_kelas: idKelas,
          id_jam_pelajaran: jamPelajaranExist?.id_jampel || '', 
        });

        if (!jadwalExist) {
          errors.push(`Jadwal Pelajaran tidak ditemukan`);
        }

        const valid = errors.length === 0;

        const payload = {
          ...row,
          id_jadwal: jadwalExist?.id_jadwal,
          id_guru_asli: guruAsliExist?.id_pegawai,
          id_guru_pengganti: guruPenggantiExist?.id_pegawai
        };

        results.push({
          row: row.__row,
          valid,
          error: errors.length ? errors.join(', ') : null,
          payload: {
            ...payload,
          },
        });

        if (mode === 'preview' || !valid) continue;

        const existing = await repository.detail({
          tanggal,
          id_jadwal: jadwalExist?.id_jadwal,
        });

        if (existing) {
          await existing.update(
            {
              ...payload,
            },
            { transaction: trx! }
          );
        } else {
          let newCreate = await GuruPengganti.create(
            {
              ...payload,
              created_by: req.user?.id
            },
            { transaction: trx! }
          );
        }
      }

      let dataRes = {
        mode,
        total: results.length,
        valid: results.filter((r) => r.valid).length,
        invalid: results.filter((r) => !r.valid).length,
      };

      if (trx) {
        await trx.commit();

        return response.success(
          'import guru pengganti berhasil',
          dataRes,
          res
        );
      }

      return response.success(
        'preview import guru pengganti',
        {
          ...dataRes,
          data: results,
        },
        res
      );
    } catch (err: any) {
      if (trx) await trx.rollback();

      //console.error(err);
      return helper.catchError(
        `import excel guru pengganti: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async insert(req: Request, res: Response) {
    const payloads = req.body?.data as any[];

    if (!Array.isArray(payloads) || payloads.length === 0) {
      return response.success('Data import kosong', null, res, false);
    }

    const trx = await sequelize.transaction();
    try {
      let data = null;
      for (const payload of payloads) {
        const existing = await repository.detail({
          tanggal: payload.tanggal,
          id_jadwal: payload.id_jadwal
        });

        if (existing) {
          await existing.update(
            {
              ...payload,
            },
            { transaction: trx }
          );
        } else {
          let newCreate = await GuruPengganti.create(
            {
              ...payload,
              created_by: req.user?.id
            },
            { transaction: trx }
          );
        }
      }

      await trx.commit();

      return response.success(
        'Import batch guru pengganti berhasil',
        { total: payloads.length },
        res
      );
    } catch (err: any) {
      await trx.rollback();
      return helper.catchError(`Import batch gagal: ${err.message}`, 500, res);
    }
  }
}

export const guruPengganti = new Controller();
