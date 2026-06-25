'use strict';

import crypto from 'crypto';
import { Request, Response } from 'express';
import { response } from '../../helpers/response';
import { helper } from '../../helpers/helper';
import { service as globalService } from '../global/global.service';
import { repository as absenRepository } from '../app/absen.harian.santri/absen.harian.santri.repository';
import { repository as kebersihanRepository } from '../app/kebersihan.temuan/kebersihan.temuan.repository';
import { repository as perizinanRepository } from '../app/perizinan.santri/perizinan.santri.repository';
import { repository as rapotRepository } from '../app/rapot.santri/rapot.santri.repository';
import Santri from '../app/santri/santri.model';
import PenempatanKamarSantri from '../app/penempatan.kamar.santri/penempatan.kamar.santri.model';
import moment from 'moment';
import {
  SUCCESS_GENERATED,
  SUCCESS_RETRIEVED,
  SUCCESS_SYNCED,
  SUCCESS_SAVED,
  NOT_FOUND,
} from '../../utils/constant';
import { appConfig } from '../../config/config.app';
import { rawQuery } from '../../helpers/rawQuery';
import { QueryTypes } from 'sequelize';

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
    const trx = await Santri.sequelize?.transaction();
    try {
      let data = req.body;
      if (!Array.isArray(data) && req.body && Array.isArray(req.body.data)) {
        data = req.body.data;
      }

      if (!Array.isArray(data)) {
        if (trx) await trx.rollback();
        return response.failed('Payload must be an array', 422, res);
      }

      const results = [];

      let santriName = [];
      for (const item of data) {
        const {
          id_santri: idSantriSitrendi,
          jenis_izin,
          tanggal_mulai,
          tanggal_selesai,
          alasan,
          file_surat,
        } = item;

        let fileSurat: any = null;
        if (!idSantriSitrendi) throw new Error('id_santri is required');
        if (!jenis_izin) throw new Error('jenis_izin is required');
        if (!tanggal_mulai) throw new Error('tanggal_mulai is required');
        if (!tanggal_selesai) throw new Error('tanggal_selesai is required');
        if (!alasan) throw new Error('alasan is required');
        if (jenis_izin && jenis_izin.toLowerCase().includes('sakit')) {
          if (!file_surat) {
            throw new Error('file_surat is required');
          }

          if (file_surat) {
            const checkFile = helper.checkExtentionBase64(file_surat, 'file');
            if (checkFile !== 'allowed') {
              if (trx) await trx.rollback();
              return response.failed(checkFile, 422, res);
            }

            fileSurat = await helper.uploadBase64(
              file_surat,
              'perizinan',
              'sitrendi',
              appConfig?.assetType
            );
          }
        }

        const student = await Santri.findOne({
          where: { id_santri_sitrendi: idSantriSitrendi },
          transaction: trx,
        });
        if (!student) {
          throw new Error(
            `Santri dengan id_santri_sitrendi [${idSantriSitrendi}] tidak ditemukan.`
          );
        }
        santriName.push(student.fullname);

        const placement = await PenempatanKamarSantri.findOne({
          where: { id_santri: student.id_santri, status: 'Aktif' },
          transaction: trx,
        });
        if (!placement || !placement.id_lokasi) {
          throw new Error(
            `Penempatan kamar aktif untuk santri [${student.fullname}] tidak ditemukan.`
          );
        }

        const hasActive = await perizinanRepository.checkActiveLicense(
          student.id_santri,
          trx
        );
        if (hasActive) {
          throw new Error(
            `Santri [${student.fullname}] masih memiliki pengajuan aktif berkriteria Menunggu / Sedang Disetujui saat ini.`
          );
        }

        const payload = {
          id_santri: student.id_santri,
          id_lokasi_kamar: placement.id_lokasi,
          sumber_pengajuan: item.sumber_pengajuan || 'Orang Tua',
          jenis_izin,
          tanggal_mulai: moment(tanggal_mulai).format('YYYY-MM-DD'),
          tanggal_selesai: moment(tanggal_selesai).format('YYYY-MM-DD'),
          alasan,
          tanggal_pengajuan: new Date(),
          status_approval: 'Menunggu',
          created_by: '00000000-0000-0000-0000-000000000000', // dari SiTrendi
          file_izin: fileSurat,
        };

        const result = await perizinanRepository.create(payload, trx);
        results.push(result);
      }

      if (trx) {
        await trx.commit();

        try {
          let receivers: string[] = [];
          try {
            const conn = await rawQuery.getConnection();
            const query = `
              SELECT DISTINCT ar.username
              FROM app_resource ar
              JOIN app_role arol ON ar.role_id = arol.role_id
              LEFT JOIN app_role_menu arm ON ar.role_id = arm.role_id
              LEFT JOIN app_menu am ON arm.menu_id = am.menu_id
              WHERE ar.status = 'A'
                AND (
                  arol.role_name = 'administrator'
                  OR (
                    am.module_name = '/app/perizinan-santri/kedisiplinan'
                    AND arm.view = 1
                    AND arm.edit = 1
                  )
                )
            `;
            const resultUsers = await conn.query(query, {
              type: QueryTypes.SELECT,
            });
            receivers = (resultUsers as any[])
              .map((u: any) => u.username)
              .filter(Boolean);
          } catch (queryErr) {
            console.error(
              'Error fetching receivers for notification:',
              queryErr
            );
          }

          if (receivers && receivers.length > 0) {
            req.user = {
              id: '00000000-0000-0000-0000-000000000000',
              username: 'sitrendi',
              full_name: 'SiTrendi',
            };
            await helper
              .sendNotification(req, {
                title: 'Request Perizinan',
                message: `Terdapat ${santriName.length} perizinan baru dari santri (${santriName.join(', ')}).`,
                url: '/app/perizinan-santri/kedisiplinan',
                receiver: receivers,
                type: 'Perizinan',
              })
              .catch((err) => {
                console.error('Error executing sendNotification:', err);
              });
          } else {
            console.warn('No receivers found for perizinan notification.');
          }
        } catch (notifErr) {
          console.error('General notification execution error:', notifErr);
        }
      }
      return response.success(SUCCESS_SAVED, results, res);
    } catch (err: any) {
      if (trx && !(trx as any).finished) {
        try {
          await trx.rollback();
        } catch (e) {}
      }
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
        id_santri: req.query.id_santri as string,
        tanggal_awal: req.query.tanggal_awal as string,
        tanggal_akhir: req.query.tanggal_akhir as string,
        isOpenApi: true,
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
      const queryParams = helper.fetchQueryRequest(req);
      const filter = {
        ...queryParams,
        status_approval: req.query.status_approval,
        jenis_izin: req.query.jenis_izin,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        is_request_canceled: req.query.is_request_canceled,
        is_canceled: req.query.is_canceled,
        id_santri: req.query.id_santri,
        isOpenApi: true,
      };

      const { rows } = await perizinanRepository.index(filter);
      if (rows?.length < 1)
        return response.success(NOT_FOUND, null, res, false);

      return response.success(SUCCESS_RETRIEVED, rows, res);
    } catch (err: any) {
      return helper.catchError(
        `fetch perizinan (Open API): ${err?.message}`,
        500,
        res
      );
    }
  }

  public async rapotSantri(req: Request, res: Response) {
    try {
      const queryParams = helper.fetchQueryRequest(req);
      const filter = {
        ...queryParams,
        tahun: req.query.tahun,
        semester: req.query.semester,
        id_santri_sitrendi: req.query.id_santri,
        isOpenApi: true,
      };

      const { rows } = await rapotRepository.index(filter);
      if (rows?.length < 1)
        return response.success(NOT_FOUND, null, res, false);

      return response.success(SUCCESS_RETRIEVED, rows, res);
    } catch (err: any) {
      return helper.catchError(
        `fetch rapot santri (Open API): ${err?.message}`,
        500,
        res
      );
    }
  }
}

export const controller = new Controller();
