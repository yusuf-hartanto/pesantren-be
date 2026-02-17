'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './location.variable';
import { response } from '../../../helpers/response';
import { repository } from './location.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import { Op } from 'sequelize';
import { locationSchema, locationUpdateSchema } from './location.schema';
import z from 'zod';

export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list({});
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`Lokasi list: ${err?.message}`, 500, res);
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
      return helper.catchError(`Lokasi index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: any = await repository.detail({ id_lokasi: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      console.log('TSSTT', `${err?.message}`)
      return helper.catchError(`Lokasi detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const payload = Array.isArray(req.body) 
        ? z.array(locationSchema).parse(req.body) 
        : [locationSchema.parse(req.body)];

      const finalData = [];

      for (const item of payload) {
        // 2. Logika Bisnis: Inherit ID Cabang dari Parent
        if (item.parent_id) {
          const parent: any = await repository.detail({ id_lokasi: item.parent_id });
          if (parent?.id_cabang) item.id_cabang = parent.id_cabang;
        }

        // 3. Cek Duplikasi
        const isDuplicate = await repository.detail({
          id_cabang: item.id_cabang || null,
          jenis_lokasi: item.jenis_lokasi,
          nama_lokasi: item.nama_lokasi,
        });

        if (isDuplicate) throw new Error(`Lokasi "${item.nama_lokasi}" sudah ada di cabang ini.`);
        
        finalData.push(item);
      }
        
      await repository.create({ payload: finalData });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      const message = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
      return helper.catchError(`Lokasi create: ${message}`, 400, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      // 1. Ambil data lama dari database
      const existingData: any = await repository.detail({ id_lokasi: id });
      if (!existingData) return response.success(NOT_FOUND, null, res, false);

      // 2. Validasi input menggunakan partial schema 
      const validatedData = locationUpdateSchema.parse(req.body);

      // 3. Gabungkan data lama dan data baru untuk keperluan logika bisnis
      const mergedData = { ...existingData.get({ plain: true }), ...validatedData };

      // 4. Logika Bisnis: Inherit ID Cabang dari Parent (jika parent_id berubah)
      if (validatedData.parent_id) {
        const parent: any = await repository.detail({ id_lokasi: validatedData.parent_id });
        if (parent?.id_cabang) {
          mergedData.id_cabang = parent.id_cabang;
        }
      }

      // 5. Check duplicate
      const isDuplicate = await repository.detail({
        id_cabang: mergedData.id_cabang || null,
        jenis_lokasi: mergedData.jenis_lokasi,
        nama_lokasi: mergedData.nama_lokasi,
        id_lokasi: { [Op.ne]: id }
      });

      if (isDuplicate) {
        throw new Error(`Kombinasi Cabang, Jenis, dan Nama "${mergedData.nama_lokasi}" sudah digunakan oleh lokasi lain.`);
      }

      // 6. Eksekusi Update
      await repository.update({
        payload: mergedData, 
        condition: { id_lokasi: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      const message = err instanceof z.ZodError ? err.issues[0]?.message : err.message;
      return helper.catchError(`Lokasi update: ${message}`, 400, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      // 1. Cek apakah data yang akan dihapus ada di database
      const check = await repository.detail({ id_lokasi: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // 2. Cek apakah lokasi ini memiliki child (sub-lokasi)
      const hasChild = await repository.detail({ parent_id: id });
      
      if (hasChild) {
        return response.success(
          `Gagal menghapus: Lokasi ini masih memiliki sub-lokasi di dalamnya. Silakan hapus atau pindahkan sub-lokasi terlebih dahulu.`, 
          null, 
          res, 
          false
        );
      }

      // 3. Jika tidak ada child, eksekusi penghapusan
      await repository.delete({
        condition: { id_lokasi: id },
      });

      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`Lokasi delete: ${err?.message}`, 500, res);
    }
  }
}

export const Location = new Controller();