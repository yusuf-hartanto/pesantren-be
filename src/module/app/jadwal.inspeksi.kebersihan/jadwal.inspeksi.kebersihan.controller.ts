'use strict';

import ExcelJS from 'exceljs';
import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './jadwal.inspeksi.kebersihan.variable';
import { response } from '../../../helpers/response';
import { repository } from './jadwal.inspeksi.kebersihan.repository';
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
import { jadwalInspeksiKebersihanSchema } from './jadwal.inspeksi.kebersihan.schema';
import { sequelize } from '../../../database/connection';
import fs from 'fs/promises';
import JadwalInspeksiKebersihan from './jadwal.inspeksi.kebersihan.model';
import { repository as cabangRepository } from '../cabang/cabang.repository';
import { repository as slotRepository } from '../master.slot.waktu/master.slot.waktu.repository';
import { repository as pegawaiRepository } from '../pegawai/pegawai.repository';
import { Op } from 'sequelize';

const date: string = helper.date();

const haris = [
  { id: 1, label: 'Senin' },
  { id: 2, label: 'Selasa' },
  { id: 3, label: 'Rabu' },
  { id: 4, label: 'Kamis' },
  { id: 5, label: 'Jumat' },
  { id: 6, label: 'Sabtu' },
  { id: 7, label: 'Ahad' },
];

const generateDataExcel = (sheet: any, details: any) => {
  sheet.addRow([
    'No',
    'Cabang',
    'Hari',
    'Slot',
    'Jam',
    'Petugas',
    'Status',
    'Keterangan',
  ]);

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.cabang?.nama_cabang || '',
      haris.find((r) => r.id == details[i]?.hari)?.label || '',
      details[i]?.master_slot_waktu?.kode_slot || '',
      `${details[i]?.master_slot_waktu?.jam_mulai?.slice(0, -3)} - ${details[i]?.master_slot_waktu?.jam_selesai?.slice(0, -3)}`,
      details[i]?.pegawai?.nama_lengkap || '',
      details[i]?.is_active ? 'Aktif' : 'Non-Aktif',
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

const normalizeRow = (row: any) => ({
  cabang: String(row['Cabang'] || '').trim(),
  hari:
    haris.find((h) => h.label === String(row['Hari'] || '').trim())?.id ?? null,
  hari_text: String(row['Hari'] || '').trim(),
  kode_slot: String(row['Slot'] || '').trim(),
  jam_mulai: String(row['Jam'] || '')
    .trim()
    .split(' - ')[0],
  jam_selesai: String(row['Jam'] || '')
    .trim()
    .split(' - ')[1],
  active: String(row['Status'] || '').trim(),
  is_active: String(row['Status'] || '').trim() === 'Aktif',
  nama_lengkap: String(row['Petugas'] || '').trim(),
  keterangan: String(row['Keterangan'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];

  if (!['Aktif', 'Non-Aktif'].includes(row.active)) {
    errors.push('Status wajib Aktif/Non-Aktif');
  }

  if (!haris.map((h) => h.label).includes(row.hari_text)) {
    errors.push(`Hari wajib ${haris.map((h) => h.label).join(', ')}`);
  }

  const valid = jadwalInspeksiKebersihanSchema.safeParse(row);

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
      const is_active: any = req?.query?.is_active || '';
      const id_petugas: any = req?.query?.id_petugas || '';
      const result = await repository.list({ is_active, id_petugas });
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(
        `jadwal inspeksi kebersihan list: ${err?.message}`,
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
      };

      const { count, rows } = await repository.index(query);

      const grouped: Record<string, any> = {};
      for (const row of rows) {
        const rowData = row.get({ plain: true });
        const key = `${rowData.id_cabang || ''}_${rowData.id_petugas || ''}_${rowData.kode_slot || ''}_${rowData.is_active}_${rowData.keterangan || ''}`;
        if (!grouped[key]) {
          grouped[key] = {
            ...rowData,
            haris: [rowData.hari],
          };
        } else {
          grouped[key].haris.push(rowData.hari);
          if (new Date(rowData.updated_at) > new Date(grouped[key].updated_at)) {
            grouped[key].updated_at = rowData.updated_at;
          }
        }
      }

      const groupedArray = Object.values(grouped);
      groupedArray.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      if (groupedArray.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(
        SUCCESS_RETRIEVED,
        { total: count, values: groupedArray },
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `jadwal inspeksi kebersihan index: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: any = await repository.detail({
        id_jadwal: id,
      });
      if (!result) return response.success(NOT_FOUND, null, res, false);

      const data = result.get({ plain: true });
      const siblingSchedules = await JadwalInspeksiKebersihan.findAll({
        where: {
          id_cabang: data.id_cabang,
          kode_slot: data.kode_slot,
        }
      });
      data.hari = siblingSchedules.map((s: any) => s.hari);

      return response.success(SUCCESS_RETRIEVED, data, res);
    } catch (err: any) {
      return helper.catchError(
        `jadwal inspeksi kebersihan detail: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const { id_cabang, hari, kode_slot, id_petugas } = req?.body;

      const idCabang = id_cabang?.value || null;
      const kodeSlot = kode_slot?.value || null;
      const idPetugas = id_petugas?.value || null;

      const days = Array.isArray(hari) ? hari : [hari];

      // Let's check duplicates for each day
      for (const h of days) {
        const check = await repository.detail({
          hari: h,
          id_cabang: idCabang,
          kode_slot: kodeSlot,
        });

        if (check) {
          const dayName = haris.find((r) => r.id == h)?.label || h;
          return response.failed(`${ALREADY_EXIST} (Hari: ${dayName})`, 400, res);
        }
      }

      const data: Object = helper.only(variable.fillable(), req?.body);
      
      for (const h of days) {
        await repository.create({
          payload: {
            ...data,
            hari: h,
            id_cabang: idCabang,
            id_petugas: idPetugas,
            kode_slot: kodeSlot,
          },
        });
      }

      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `jadwal inspeksi kebersihan create: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const { id_cabang, hari, kode_slot, id_petugas } = req?.body;
      const idCabang = id_cabang?.value;
      const kodeSlot = kode_slot?.value;
      const idPetugas = id_petugas?.value;
      const check = await repository.detail({ id_jadwal: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      const days = Array.isArray(hari) ? hari : [hari];

      // Check duplicates
      for (const h of days) {
        const duplicate = await repository.detail({
          hari: h,
          id_cabang: idCabang || check.id_cabang,
          kode_slot: kodeSlot || check.kode_slot,
        });

        if (
          duplicate && 
          (duplicate.id_cabang !== check.id_cabang || duplicate.kode_slot !== check.kode_slot)
        ) {
          const dayName = haris.find((r) => r.id == h)?.label || h;
          return response.failed(`${ALREADY_EXIST} (Hari: ${dayName})`, 400, res);
        }
      }

      // Find all existing records in this group
      const existingRecords = await JadwalInspeksiKebersihan.findAll({
        where: {
          id_cabang: check.id_cabang,
          kode_slot: check.kode_slot,
        }
      });

      const existingDays = existingRecords.map((r: any) => r.hari);

      // Days to delete: in existingDays but not in new days
      const daysToDelete = existingDays.filter((d: number) => !days.includes(d));

      // Days to create: in new days but not in existingDays
      const daysToCreate = days.filter((d: number) => !existingDays.includes(d));

      // Days to update: in new days and in existingDays
      const daysToUpdate = days.filter((d: number) => existingDays.includes(d));

      const data: Object = helper.only(variable.fillable(), req?.body, true);
      const updatePayload = {
        ...data,
        id_cabang: idCabang || check?.getDataValue('id_cabang'),
        id_petugas: idPetugas || check?.getDataValue('id_petugas'),
        kode_slot: kodeSlot || check?.getDataValue('kode_slot'),
      };

      // 1. Delete removed days
      if (daysToDelete.length > 0) {
        await JadwalInspeksiKebersihan.destroy({
          where: {
            id_cabang: check.id_cabang,
            kode_slot: check.kode_slot,
            hari: daysToDelete,
          },
          individualHooks: true,
        });
      }

      // 2. Update remaining existing days
      if (daysToUpdate.length > 0) {
        const { hari, ...payloadTanpaHari } = updatePayload as { hari?: number[] };
        await JadwalInspeksiKebersihan.update(payloadTanpaHari, {
          where: {
            id_cabang: check.id_cabang,
            kode_slot: check.kode_slot,
            hari: {
              [Op.in]: daysToUpdate,
            }
          },
          individualHooks: true,
        });
      }

      // 3. Create new days
      for (const d of daysToCreate) {
        await repository.create({
          payload: {
            ...updatePayload,
            hari: d,
          }
        });
      }

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `jadwal inspeksi kebersihan update: ${err?.message}`,
        500,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const check = await repository.detail({ id_jadwal: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);
      
      await JadwalInspeksiKebersihan.destroy({
        where: {
          id_cabang: check.id_cabang,
          kode_slot: check.kode_slot,
        },
        individualHooks: true,
      });

      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(
        `jadwal inspeksi kebersihan delete: ${err?.message}`,
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
        result = await repository.list({ is_active: q });
        if (result?.length < 1)
          return response.success(NOT_FOUND, null, res, false);
      }

      const { dir, path } = await helper.checkDirExport('excel');

      const name: string = 'jadwal-inspeksi-kebersihan';
      const filename: string = `${name}-${isTemplate ? 'template' : moment().tz(TIMEZONE).format('DDMMYYYY')}.xlsx`;
      const title: string = `${name.replace(/-/g, ' ').toUpperCase()}`;
      const urlExcel: string = `${dir}/${filename}`;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title);

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);
      return response.success(
        'export excel jadwal inspeksi kebersihan',
        urlExcel,
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `export excel jadwal inspeksi kebersihan: ${err?.message}`,
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

        const nama_cabang = row.cabang;
        const hari = row.hari;
        const kode_slot = row.kode_slot;
        const jam_mulai = row.jam_mulai;
        const jam_selesai = row.jam_selesai;
        const nama_lengkap = row.nama_lengkap;

        const cabangExist = await cabangRepository.detail({ nama_cabang });
        if (!cabangExist) {
          errors.push(`Cabang ${nama_cabang} tidak ditemukan`);
        }

        const slotExist = await slotRepository.detail({
          kode_slot,
          jam_mulai,
          jam_selesai,
        });
        if (!slotExist) {
          errors.push(
            `Kode Slot ${kode_slot}, Jam Mulai ${jam_mulai}, Jam Selesai ${jam_selesai} tidak ditemukan`
          );
        }

        const pegawaiExist = await pegawaiRepository.detail({ nama_lengkap });
        if (!pegawaiExist) {
          errors.push(`Petugas ${nama_lengkap} tidak ditemukan`);
        }

        const valid = errors.length === 0;

        const payload = {
          id_cabang: cabangExist?.id_cabang,
          cabang: cabangExist?.nama_cabang,
          kode_slot: slotExist?.kode_slot,
          jam_mulai: slotExist?.jam_mulai,
          jam_selesai: slotExist?.jam_selesai,
          id_petugas: pegawaiExist?.id_pegawai,
          petugas: pegawaiExist?.nama_lengkap,
          hari: row.hari,
          hari_text: row.hari_text,
          status: row.active,
          is_active: row.is_active,
          keterangan: row.keterangan ?? null,
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
          hari,
          id_cabang: cabangExist?.id_cabang,
          kode_slot: slotExist?.kode_slot,
        });

        if (existing) {
          await existing.update(
            {
              ...payload,
            },
            { transaction: trx! }
          );
        } else {
          let newCreate = await JadwalInspeksiKebersihan.create(
            {
              ...payload,
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
          'import jadwal inspeksi kebersihan berhasil',
          dataRes,
          res
        );
      }

      return response.success(
        'preview import jadwal inspeksi kebersihan',
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
        `import excel jadwal inspeksi kebersihan: ${err?.message}`,
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
          id_cabang: payload.id_cabang,
          kode_slot: payload.kode_slot,
          hari: payload.hari,
        });

        if (existing) {
          await existing.update(
            {
              ...payload,
            },
            { transaction: trx }
          );
        } else {
          let newCreate = await JadwalInspeksiKebersihan.create(
            {
              ...payload,
            },
            { transaction: trx }
          );
        }
      }

      await trx.commit();

      return response.success(
        'Import batch jadwal inspeksi kebersihan berhasil',
        { total: payloads.length },
        res
      );
    } catch (err: any) {
      await trx.rollback();
      return helper.catchError(`Import batch gagal: ${err.message}`, 500, res);
    }
  }
}

export const jadwalInspeksiKebersihan = new Controller();
