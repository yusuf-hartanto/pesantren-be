'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './pegawai.variable';
import { response } from '../../../helpers/response';
import { repository } from './pegawai.repository';
import { pegawaiSchema } from './pegawai.schema'; // Import Zod Schema
import moment from 'moment';
import { z } from 'zod';
import {
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';

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

    // 2. Hitung Umur Otomatis
    if (item.tanggal_lahir) {
      const birthDate = moment(item.tanggal_lahir);
      if (birthDate.isValid()) {
        item.umur = moment().diff(birthDate, 'years');
      }
    }

    // 3. Validasi Hierarki Wilayah
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
        // A. Validasi Schema Zod
        const validItem = pegawaiSchema.parse(item);
        
        // B. Validasi Logika Bisnis & Transformasi Data
        let finalItem = await this.validateBusinessLogic(validItem);
        
        // C. Filter Fillable Fields
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
}

export const Pegawai = new Controller();