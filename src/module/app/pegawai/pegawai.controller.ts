'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './pegawai.variable';
import { response } from '../../../helpers/response';
import { repository } from './pegawai.repository';
import { repository as orgRepo } from '../organization.unit/organization.unit.repository';
import { repository as jabatanRepo } from '../jabatan/jabatan.repository';
import { pegawaiSchema } from './pegawai.schema'; 
import moment from 'moment';
import { z } from 'zod';
import {
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import fs from 'fs/promises';
import ExcelJS from "exceljs";
import { Op } from 'sequelize';

const generateDataExcel = (sheet: any, details: any) => {
  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'NIK', key: 'nik', width: 18 },
    { header: 'NIP', key: 'nip', width: 18 },
    { header: 'Nama Lengkap', key: 'nama_lengkap', width: 25 },
    { header: 'Email', key: 'email', width: 20 },
    { header: 'No HP', key: 'no_hp', width: 15 },
    { header: 'L/P', key: 'jenis_kelamin', width: 8 },
    { header: 'Tempat Lahir', key: 'tempat_lahir', width: 15 },
    { header: 'Tgl Lahir', key: 'tanggal_lahir', width: 12 },
    // { header: 'Unit Kerja', key: 'unit', width: 20 },
    // { header: 'Jabatan', key: 'jabatan', width: 20 },
    { header: 'Pendidikan', key: 'pendidikan', width: 15 },
    { header: 'Bidang Ilmu', key: 'bidang_ilmu', width: 15 },
    { header: 'TMT', key: 'tmt', width: 12 },
    { header: 'Status', key: 'status_pegawai', width: 12 },
    // Bagian Wilayah yang Diperbaiki
    { header: 'Provinsi', key: 'provinsi', width: 20 },
    { header: 'Kota/Kabupaten', key: 'kota', width: 20 },
    { header: 'Kecamatan', key: 'kecamatan', width: 20 },
    { header: 'Kelurahan', key: 'kelurahan', width: 20 },
    { header: 'Alamat', key: 'alamat', width: 35 },
  ];

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  });

  details.forEach((item: any, i: number) => {
    sheet.addRow({
      no: i + 1,
      nik: item.nik || '',
      nip: item.nip || '',
      nama_lengkap: item.nama_lengkap || '',
      email: item.email || '',
      no_hp: item.no_hp || '',
      jenis_kelamin: item.jenis_kelamin === 'Laki-laki' ? 'L' : 'P',
      tempat_lahir: item.tempat_lahir || '',
      tanggal_lahir: item.tanggal_lahir ? moment(item.tanggal_lahir).format('YYYY-MM-DD') : '',
      // unit: item.organizationUnit?.nama_orgunit || '',
      // jabatan: item.jabatan?.nama_jabatan || '',
      pendidikan: item.pendidikan || '',
      bidang_ilmu: item.bidang_ilmu || '',
      tmt: item.tmt ? moment(item.tmt).format('YYYY-MM-DD') : '',
      status_pegawai: item.status_pegawai || '',
      // Mapping wilayah dari relasi include di repository
      provinsi: item.province?.name || '',
      kota: item.city?.name || '',
      kecamatan: item.district?.name || '',
      kelurahan: item.subDistrict?.name || '',
      alamat: item.alamat || '',
    });
  });

  // Tambahkan Border
  for (let row = 1; row <= (details?.length || 0) + 1; row++) {
    sheet.getRow(row).eachCell((cell: any) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  }

  return sheet;
};

const normalizeRow = (row: any) => ({
  nik: String(row['NIK'] || '').trim(),
  nip: String(row['NIP'] || '').trim(),
  nama_lengkap: String(row['Nama Lengkap'] || '').trim(),
  email: String(row['Email'] || '').trim(),
  no_hp: String(row['No HP'] || '').trim(),
  jenis_kelamin: row['L/P'] === 'P' ? 'Perempuan' : 'Laki-laki',
  tempat_lahir: String(row['Tempat Lahir'] || '').trim(),
  tanggal_lahir: row['Tgl Lahir'] || null,
  pendidikan: String(row['Pendidikan'] || '').trim(),
  bidang_ilmu: String(row['Bidang Ilmu'] || '').trim(),
  tmt: row['TMT'] || null,
  status_pegawai: String(row['Status'] || 'Aktif').trim(),
  foto: String(row['Foto'] || '').trim(),
  nama_orgunit: String(row['Unit Kerja'] || '').trim(),
  nama_jabatan: String(row['Jabatan'] || '').trim(),
  provinsi: String(row['Provinsi'] || '').trim(),
  kota_kabupaten: String(row['Kota/Kabupaten'] || '').trim(),
  kecamatan: String(row['Kecamatan'] || '').trim(),
  kelurahan: String(row['Kelurahan'] || '').trim(),
  alamat: String(row['Alamat'] || '').trim(),
  __row: row.__row,
});

const validateRow = (row: any) => {
  const errors: string[] = [];
  if (!row.nama_lengkap) errors.push('Nama Lengkap wajib diisi');
  if (!row.nik && !row.nip) errors.push('NIK atau NIP harus diisi salah satu');
  return errors;
};
export default class Controller {
  constructor() {
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
  }
  /**
   * Validasi Logika Bisnis (NIK/NIP Unique, Umur, & Hierarki Wilayah)
   */
  private async validateBusinessLogic(item: any, id_pegawai?: string) {
    // 1. Cek Duplikasi NIK & NIP
    const checkNik = await repository.checkDuplicate('nik', item.nik, id_pegawai);
    if (checkNik) throw new Error(`NIK [${item.nik}] sudah terdaftar pada pegawai lain.`);

    if (item.nip) {
      const checkNip = await repository.checkDuplicate('nip', item.nip, id_pegawai);
      if (checkNip) throw new Error(`NIP [${item.nip}] sudah terdaftar pada pegawai lain.`);
    }

    // Hitung Umur Otomatis
    if (item.tanggal_lahir) {
      const birthDate = moment(item.tanggal_lahir);
      if (birthDate.isValid()) {
        item.umur = moment().diff(birthDate, 'years');
      }
    }

    // Validasi Hierarki Wilayah
    if (item.sub_district_id && (!item.district_id || !item.city_id || !item.province_id)) {
      throw new Error('Data Wilayah Tidak Lengkap: Jika Kelurahan diisi, maka Kecamatan, Kota, dan Provinsi wajib ada.');
    }
    if (item.district_id && (!item.city_id || !item.province_id)) {
      throw new Error('Data Wilayah Tidak Lengkap: Jika Kecamatan diisi, maka Kota dan Provinsi wajib ada.');
    }
    if (item.city_id && !item.province_id) {
      throw new Error('Data Wilayah Tidak Lengkap: Jika Kota diisi, maka Provinsi wajib ada.');
    }

    return item;
  }

  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list({});
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`Pegawai list: ${err?.message}`, 500, res);
    }
  }

  public async index(req: Request, res: Response) {
    try {
      const query = helper.fetchQueryRequest(req);
      const { count, rows } = await repository.index(query);
      if (rows?.length < 1) return response.success(NOT_FOUND, null, res, false);
      
      return response.success(SUCCESS_RETRIEVED, { total: count, values: rows }, res);
    } catch (err: any) {
      return helper.catchError(`Pegawai index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await repository.detail({ id_pegawai: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`Pegawai detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const body = req.body;
      const payloadArray = Array.isArray(body) ? body : [body];
      const validatedData = [];

      for (const item of payloadArray) {
        // Validasi Schema Zod
        const validItem = pegawaiSchema.parse(item);
        
        // Validasi Logika Bisnis & Transformasi Data
        let finalItem = await this.validateBusinessLogic(validItem);
        
        // Filter Fillable Fields
        validatedData.push(helper.only(variable.fillable(), finalItem));
      }

      await repository.create({ payload: validatedData });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      // Menangani error Zod secara spesifik agar pesan lebih user-friendly
      const msg = err instanceof z.ZodError ? `Validasi Gagal: ${err.issues[0].message}` : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const check = await repository.detail({ id_pegawai: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // A. Validasi Schema Zod (Partial agar tidak wajib semua field diisi saat update)
      const validData = pegawaiSchema.partial().parse(req.body);

      // B. Validasi Logika Bisnis & Duplikasi
      const finalUpdate = await this.validateBusinessLogic({ ...check.toJSON(), ...validData }, id);

      // C. Filter Fillable & Simpan
      const payload = helper.only(variable.fillable(), finalUpdate, true);
      await repository.update({
        payload: { ...payload, updated_at: helper.date() },
        condition: { id_pegawai: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      const msg = err instanceof z.ZodError ? `Update Gagal: ${err.issues[0].message}` : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const check = await repository.detail({ id_pegawai: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // Melakukan Soft Delete (Sequelize paranoid)
      await repository.delete({ id_pegawai: id });
      
      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`Gagal menghapus: ${err?.message}`, 500, res);
    }
  }

  public async export(req: Request, res: Response) {
    try {
      let condition: any = {};
      const { q, template } = req?.body;
      const isTemplate: boolean = template && template == '1';

      if (q) {
        condition = { nama_lengkap: { [Op.like]: `%${q}%` } };
      }

      const result = await repository.listForExport(condition, isTemplate ? 5 : undefined);
      if (!isTemplate && result?.length < 1) return response.success(NOT_FOUND, null, res, false);

      const { dir, path } = await helper.checkDirExport('excel');
      const filename = `pegawai-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;
      
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('DATA PEGAWAI');

      generateDataExcel(sheet, result);
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success('export excel pegawai', `${dir}/${filename}`, res);
    } catch (err: any) {
      return helper.catchError(`export excel pegawai: ${err?.message}`, 500, res);
    }
  }

  public async import(req: Request, res: Response) {
    const mode: 'preview' | 'commit' = req.body?.mode ?? 'preview';
    const uploaded = req.files?.file_import;
    if (!uploaded) return response.success('File tidak valid', null, res, false);

    try {
      const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      const buffer = file.tempFilePath ? await fs.readFile(file.tempFilePath) : file.data;
      const rows = await helper.parseImportFile({ name: file.name, data: buffer });
      const results: any[] = [];

      for (const raw of rows) {
        const row = normalizeRow(raw);
        const errors = validateRow(row);
        
        let id_orgunit = null, id_jabatan = null;

        // Resolve Wilayah IDs
        const areas = await repository.resolveAreaIds(row);

        // Resolve Unit Kerja & Jabatan IDs
        // if (row.nama_orgunit) {
        //   const unit = await orgRepo.findByName(row.nama_orgunit, );
        //   if (unit) id_orgunit = unit.id_orgunit;
        //   else errors.push(`Unit "${row.nama_orgunit}" tidak ditemukan`);
        // }
        // if (row.nama_jabatan) {
        //   const jab = await jabatanRepo.detail({ nama_jabatan: row.nama_jabatan });
        //   if (jab) id_jabatan = jab.id_jabatan;
        //   else errors.push(`Jabatan "${row.nama_jabatan}" tidak ditemukan`);
        // }

        const valid = errors.length === 0;
        const payload = {
          nik: row.nik,
          nip: row.nip,
          nama_lengkap: row.nama_lengkap,
          email: row.email,
          no_hp: row.no_hp,
          jenis_kelamin: row.jenis_kelamin,
          tempat_lahir: row.tempat_lahir,
          tanggal_lahir: row.tanggal_lahir ? moment(row.tanggal_lahir).format('YYYY-MM-DD') : null,
          pendidikan: row.pendidikan,
          bidang_ilmu: row.bidang_ilmu,
          tmt: row.tmt ? moment(row.tmt).format('YYYY-MM-DD') : null,
          status_pegawai: row.status_pegawai,
          foto: row.foto,
          alamat: row.alamat,
          id_orgunit,
          id_jabatan,
          ...areas
        };

        results.push({
          row: row.__row,
          valid,
          error: errors.length ? errors.join(', ') : null,
          payload
        });
      }

      if (mode === 'commit') {
        const validPayloads = results.filter(r => r.valid).map(r => r.payload);
        if (validPayloads.length > 0) await repository.insertImport(validPayloads);
        return response.success('import pegawai berhasil', { total: validPayloads.length }, res);
      }

      return response.success('preview import pegawai', { total: results.length, data: results }, res);
    } catch (err: any) {
      return helper.catchError(`import excel pegawai: ${err?.message}`, 500, res);
    }
  }

  public insert = async (req: Request, res: Response) => {
    const payloads = req.body?.data as any[];
    if (!payloads || payloads.length === 0) return response.success('Data kosong', null, res, false);

    try {
      await repository.insertImport(payloads);
      return response.success('Import batch berhasil', { count: payloads.length }, res);
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  }
}

export const Pegawai = new Controller();