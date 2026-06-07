'use strict';

import crypto from 'crypto';
import { Request, Response } from 'express';
import { response } from '../../helpers/response';
import { helper } from '../../helpers/helper';
import { service as globalService } from '../global/global.service';
import { repository as absenRepository } from '../app/absen.harian.santri/absen.harian.santri.repository';
import { repository as kebersihanRepository } from '../app/kebersihan.temuan/kebersihan.temuan.repository';
import {
  SUCCESS_GENERATED,
  SUCCESS_RETRIEVED,
  SUCCESS_SYNCED,
} from '../../utils/constant';

const SECRET_KEY = process.env.SITRENDI_SECRET_KEY || 'pesantren_key';

export default class Controller {
  public async generateSignature(req: Request, res: Response) {
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      let rawBody = '';
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (req.rawBody && req.rawBody.length > 0) {
          rawBody = req.rawBody.toString('utf-8');
        } else if (req.body && Object.keys(req.body).length > 0) {
          rawBody = JSON.stringify(req.body);
        }
      }

      const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(timestamp + rawBody)
        .digest('hex');

      return response.success(
        SUCCESS_GENERATED,
        {
          'X-Timestamp': timestamp,
          'X-Signature': signature,
        },
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `generate signature (Open API): ${err?.message}`,
        500,
        res
      );
    }
  }
  public async syncSantri(req: Request, res: Response) {
    try {
      let data = req.body;
      if (!Array.isArray(data) && req.body && Array.isArray(req.body.data)) {
        data = req.body.data;
      }

      if (!Array.isArray(data)) {
        return response.failed('Payload must be an array', 422, res);
      }

      const result = await globalService.syncSantriData(data);
      return response.success(`${SUCCESS_SYNCED} (Santri)`, result, res);
    } catch (err: any) {
      return helper.catchError(
        `sync santri (Open API): ${err?.message}`,
        500,
        res
      );
    }
  }

  public async syncPerizinan(req: Request, res: Response) {
    try {
      let data = req.body;
      if (!Array.isArray(data) && req.body && Array.isArray(req.body.data)) {
        data = req.body.data;
      }

      if (!Array.isArray(data)) {
        return response.failed('Payload must be an array', 422, res);
      }

      // TODO: integration database perizinan
      return response.success(
        `${SUCCESS_SYNCED} (Perizinan)`,
        {
          synced_count: Array.isArray(data) ? data.length : 1,
          processed_at: new Date().toISOString(),
          body: data,
        },
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `sync perizinan (Open API): ${err?.message}`,
        500,
        res
      );
    }
  }

  public async absensiHarian(req: Request, res: Response) {
    try {
      const queryParams = helper.fetchQueryRequest(req);
      const filter = {
        ...queryParams,
        tanggal: req.query.tanggal as string,
        status: req.query.status as string,
        id_lokasi_kamar: req.query.id_lokasi_kamar as string,
        id_shift_presensi: req.query.id_shift_presensi as string,
      };

      const result = await absenRepository.index(filter);
      return response.success(`${SUCCESS_RETRIEVED} (Absensi)`, result, res);
    } catch (err: any) {
      return helper.catchError(
        `absensi harian (Open API): ${err?.message}`,
        500,
        res
      );
    }
  }

  public async kebersihanTemuan(req: Request, res: Response) {
    try {
      const queryParams = helper.fetchQueryRequest(req);
      const filter = {
        ...queryParams,
        status: req.query.status as string,
        id_lokasi: req.query.id_lokasi as string,
        id_cabang: req.query.id_cabang as string,
        tanggal_awal: req.query.tanggal_awal as string,
        tanggal_akhir: req.query.tanggal_akhir as string,
      };

      const result = await kebersihanRepository.index(filter);
      return response.success(`${SUCCESS_RETRIEVED} (Kebersihan)`, result, res);
    } catch (err: any) {
      return helper.catchError(
        `kebersihan temuan (Open API): ${err?.message}`,
        500,
        res
      );
    }
  }

  public async perizinan(req: Request, res: Response) {
    try {
      return response.success(
        `${SUCCESS_RETRIEVED} (Perizinan)`,
        {
          count: 1,
          rows: [
            {
              perizinan: 'To Do',
            },
          ],
        },
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `fetch perizinan (Open API): ${err?.message}`,
        500,
        res
      );
    }
  }
}

export const controller = new Controller();
