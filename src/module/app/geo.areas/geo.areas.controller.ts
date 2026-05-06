'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { response } from '../../../helpers/response';
import { repository } from './geo.areas.repository';
import {
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import { geoAreaFullSchema, geoAreaUpdateSchema } from './geo.areas.schema';
import z from 'zod';

export default class Controller {
  /**
   * Mengambil semua daftar geo area (tanpa pagination)
   */
  public async list(req: Request, res: Response) {
    try {
      console.log('PARAMS', req.query)
      const result = await repository.list(req.query);
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`GeoArea list: ${err?.message}`, 500, res);
    }
  }

  /**
   * Mengambil daftar geo area dengan pagination dan pencarian
   */
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
      return helper.catchError(`GeoArea index: ${err?.message}`, 500, res);
    }
  }

  /**
   * Mengambil detail satu area berdasarkan ID Geo
   */
  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: any = await repository.detail({ id_geo: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`GeoArea detail: ${err?.message}`, 500, res);
    }
  }

  /**
   * Menyimpan Area Baru
   * Rules: 
   * - Menaikkan versi secara otomatis
   * - Menonaktifkan area lama di lokasi yang sama (diatur di repository)
   */
  public async create(req: Request, res: Response) {
    try {
      // Validasi payload (Single Create)
      // Gunakan geoAreaFullSchema untuk validasi keterkaitan tipe_geo dengan koordinat
      const validatedData = geoAreaFullSchema.parse(req.body);

      // Eksekusi repository (logika menonaktifkan versi lama ada di repository.create)
      const result = await repository.create({ payload: validatedData });

      return response.success(SUCCESS_SAVED, result, res);
    } catch (err: any) {
      console.error('GeoArea Create Error:', err);

      let errorMessage = err.message;
      let errorCode = 500;

      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        const fieldName = firstIssue.path.join('.'); 
        errorMessage = `Field [${fieldName}]: ${firstIssue.message}`;
        errorCode = 400;
      }

      return helper.catchError(`GeoArea create: ${errorMessage}`, errorCode, res);
    }
  }

  /**
   * Update Area
   * Rules:
   * - Update hanya untuk meta-data (nama_area, keterangan)
   * - Jika ingin mengubah koordinat/geofence, disarankan membuat baru (create) agar history versi terjaga
   */
  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      const existingData: any = await repository.detail({ id_geo: id });
      if (!existingData) return response.success(NOT_FOUND, null, res, false);
      console.log('body', req.body)
      const validatedData = geoAreaUpdateSchema.parse(req.body);

      await repository.update({
        payload: validatedData, 
        condition: { id_geo: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;

      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        errorMessage = `Field [${firstIssue.path.join('.')}]: ${firstIssue.message}`;
        errorCode = 400;
      }

      return helper.catchError(`GeoArea update: ${errorMessage}`, errorCode, res);
    }
  }

  /**
   * Menghapus Area
   */
  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      const check = await repository.detail({ id_geo: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      await repository.delete({
        condition: { id_geo: id },
      });

      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`GeoArea delete: ${err?.message}`, 500, res);
    }
  }

  /**
   * Custom Method: Mengambil area yang sedang aktif di satu lokasi
   */
  public async getActive(req: Request, res: Response) {
    try {
      const { id_lokasi } = req.params;
      const result = await repository.findActiveByLokasi(id_lokasi);
      
      if (!result) return response.success('Tidak ada area aktif untuk lokasi ini', null, res, false);
      
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`GeoArea getActive: ${err?.message}`, 500, res);
    }
  }
}

export const GeoArea = new Controller();