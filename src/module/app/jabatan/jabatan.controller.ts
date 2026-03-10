'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './jabatan.variable';
import { response } from '../../../helpers/response';
import { repository } from './jabatan.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import z from 'zod';
import { jabatanSchema } from './jabatan.schema';

const date: string = helper.date();

export default class Controller {
  public async list(req: Request, res: Response) {
    try {
      const result = await repository.list({});
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`jabatan list: ${err?.message}`, 500, res);
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
      return helper.catchError(`jabatan index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result: Object | any = await repository.detail({ id_jabatan: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`jabatan detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const body = req.body;
      const payloadArray = Array.isArray(body) ? body : [body];
      const validatedData = [];

      for (const item of payloadArray) {
        const validItem = jabatanSchema.parse(item);

        // 1. Cek duplikasi KODE di unit tersebut
        const existKode = await repository.checkUniqueInOrgunit(validItem.id_orgunit, 'kode_jabatan', validItem.kode_jabatan);
        if (existKode) throw new Error(`Kode [${validItem.kode_jabatan}] sudah ada di unit ini.`);

        // 2. Cek duplikasi NAMA di unit tersebut
        const existNama = await repository.checkUniqueInOrgunit(validItem.id_orgunit, 'nama_jabatan', validItem.nama_jabatan);
        if (existNama) throw new Error(`Nama Jabatan [${validItem.nama_jabatan}] sudah ada di unit ini.`);

        validatedData.push(helper.only(variable.fillable(), validItem));
      }

      await repository.create({ payload: validatedData });
      return response.success(SUCCESS_SAVED, null, res);

    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;

      if (err instanceof z.ZodError) {
        errorMessage = `Field [${err.issues[0].path.join('.')}]: ${err.issues[0].message}`;
        errorCode = 400;
      } else if (err.message.includes('sudah digunakan')) {
        errorCode = 400;
      }

      return helper.catchError(`Jabatan create: ${errorMessage}`, errorCode, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      const check = await repository.detail({ id_jabatan: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // 1. Validasi Partial Schema
      const validData = jabatanSchema.partial().parse(req.body);

      // 2. Cek Unik jika kode atau orgunit diubah
      const orgId = validData.id_orgunit || check.id_orgunit;

      // Cek Kode jika berubah
      if (validData.kode_jabatan) {
        const exist = await repository.checkUniqueInOrgunit(orgId, 'kode_jabatan', validData.kode_jabatan, id);
        if (exist) throw new Error(`Kode [${validData.kode_jabatan}] sudah digunakan di unit ini.`);
      }

      // Cek Nama jika berubah
      if (validData.nama_jabatan) {
        const exist = await repository.checkUniqueInOrgunit(orgId, 'nama_jabatan', validData.nama_jabatan, id);
        if (exist) throw new Error(`Nama Jabatan [${validData.nama_jabatan}] sudah digunakan di unit ini.`);
      }

      const dataToUpdate = helper.only(variable.fillable(), validData, true);
      await repository.update({
        payload: dataToUpdate,
        condition: { id_jabatan: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);

    } catch (err: any) {
      let errorMessage = err.message;
      let errorCode = 500;

      if (err instanceof z.ZodError) {
        errorMessage = `Field [${err.issues[0].path.join('.')}]: ${err.issues[0].message}`;
        errorCode = 400;
      }

      return helper.catchError(`Jabatan update: ${errorMessage}`, errorCode, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      const check = await repository.detail({ id_jabatan: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // 3. Proteksi Hapus: Cek relasi Pegawai
      const hasPegawai = await repository.checkHasPegawai(id);
      if (hasPegawai) {
        return response.failed(
          "Jabatan tidak bisa dihapus karena masih digunakan oleh data pegawai.", 
          400, 
          res
        );
      }

      await repository.delete({ condition: { id_jabatan: id } });
      return response.success(SUCCESS_DELETED, null, res);

    } catch (err: any) {
      return helper.catchError(`Jabatan delete: ${err?.message}`, 500, res);
    }
  }
}

export const Jabatan = new Controller();
