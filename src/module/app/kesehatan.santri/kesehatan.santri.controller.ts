'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { response } from '../../../helpers/response';
import { repository } from './kesehatan.santri.repository';
import {
  createKesehatanSchema,
  updateKesehatanSchema,
} from './kesehatan.santri.schema';
import KesehatanSantri from './kesehatan.santri.model';
import PerizinanSantri from '../perizinan.santri/perizinan.santri.model';
import SuratPerizinanSantri from '../surat.perizinan.santri/surat.perizinan.santri.model';
import { repository as JamKerjaPegawaiRepository } from '../pegawai.jam.kerja/pegawai.jam.kerja.repository';
import { repository as AbsenHarianPegawaiRepository } from '../pegawai.absen.harian/pegawai.absen.harian.repository';
import {
  NOT_FOUND,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
  TIMEZONE,
} from '../../../utils/constant';
import moment from 'moment';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { variable } from './kesehatan.santri.variable';

const generateDataExcel = (sheet: any, details: any) => {
  sheet.addRow([
    'No',
    'Subjek',
    'Nama Pasien',
    'NIS / NIP',
    'Kategori Sakit',
    'Progres Status',
    'Tanggal Pemeriksaan',
    'Keluhan',
    'Tindakan',
    'Lokasi Rawat / Rujukan',
    'Estimasi (Hari)',
    'Petugas UKS',
    'Status Izin',
  ]);

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    const row = details[i];
    const isSantri = !!row.id_santri;
    const subjek = isSantri ? 'Santri' : 'Pegawai';
    const namaPasien = isSantri
      ? row.santri?.fullname
      : row.pegawai?.nama_lengkap;
    const identitas = isSantri ? row.santri?.nis : row.pegawai?.nip;

    let lokasiRawatRujukan = '-';
    if (row.progres_status === 'Dirawat') {
      lokasiRawatRujukan = `Dirawat di: ${row.tempat_dirawat || '-'}`;
    } else if (row.progres_status === 'Dirujuk') {
      lokasiRawatRujukan = `Dirujuk ke: ${row.tempat_rujukan || '-'}`;
    }

    sheet.addRow([
      parseInt(i) + 1,
      subjek,
      namaPasien || '-',
      identitas || '-',
      row.kategori_sakit || '-',
      row.progres_status || '-',
      row.tanggal_event ? moment(row.tanggal_event).format('YYYY-MM-DD') : '-',
      row.keluhan || '-',
      row.tindakan || '-',
      lokasiRawatRujukan,
      row.estimasi_hari !== null ? row.estimasi_hari : '-',
      row.petugas?.full_name || '-',
      row.perizinan?.status_approval || '-',
    ]);
  }
};

export class KesehatanSantriController {
  public async index(req: Request, res: Response) {
    try {
      const query = helper.fetchQueryRequest(req);

      const {
        progres_status,
        kategori_sakit,
        id_santri,
        id_pegawai,
        tanggal_awal,
        tanggal_akhir,
        subject_type,
      } = req?.query;
      const filterData = {
        ...query,
        progres_status,
        kategori_sakit,
        id_santri,
        id_pegawai,
        tanggal_awal,
        tanggal_akhir,
        subject_type,
      };
      const result = await repository.index(filterData);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      const result = await repository.detail({ id_kesehatan: id });
      if (!result) {
        return response.success(NOT_FOUND, null, res, false);
      }
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    const trx = await KesehatanSantri.sequelize?.transaction();
    try {
      const validData = createKesehatanSchema.parse(req.body);

      const id_petugas = req.user?.id || req.body.id_petugas || 'ADMIN';
      const isPegawaiPatient = !!validData.id_pegawai;

      let perizinan_id: string | null = null;
      let izin_auto_created = false;
      let sumber_pengajuan: 'Kesehatan' | null = null;

      if (validData.progres_status == 'Dirujuk') {
        const hasActive = await repository.checkActivePerizinan(
          validData.id_santri || null,
          validData.id_pegawai || null,
          trx
        );
        if (hasActive) {
          return response.success(
            'Santri/Pegawai masih memiliki izin aktif.',
            isPegawaiPatient ? validData.id_pegawai : validData.id_santri,
            res,
            false
          );
        }

        let activeKamarId: string | null = null;
        let activeWorkLocationId = validData.id_lokasi_kerja || null;
        let codeUnit = 'IZN';

        if (isPegawaiPatient) {
          const activeWorkLocation = activeWorkLocationId
            ? await repository.getLocation(activeWorkLocationId)
            : null;
          codeUnit = activeWorkLocation?.kode_lokasi || 'IZN';
        } else {
          activeKamarId = await repository.getActiveKamar(
            validData.id_santri as string,
            validData.tanggal_dirujuk || undefined
          );
          const activeKamar = activeKamarId
            ? await repository.getLocation(activeKamarId)
            : null;
          codeUnit = activeKamar?.kode_lokasi || 'IZN';
        }

        const tanggalMulai = moment(validData.tanggal_dirujuk).format(
          'YYYY-MM-DD'
        );
        const tanggalSelesai = moment(tanggalMulai)
          .add(validData.estimasi_hari, 'days')
          .format('YYYY-MM-DD');

        const userLogin = req?.user?.id || 'ADMIN';
        const perizinanPayload = {
          id_santri: isPegawaiPatient ? null : validData.id_santri,
          id_lokasi_kamar: isPegawaiPatient ? null : activeKamarId,
          id_pegawai: isPegawaiPatient ? validData.id_pegawai : null,
          id_lokasi_kerja: isPegawaiPatient ? activeWorkLocationId : null,
          sumber_pengajuan: 'Kesehatan',
          jenis_izin: 'Sakit',
          kondisi: 'Sakit',
          tanggal_pengajuan: new Date(),
          tanggal_mulai: tanggalMulai,
          tanggal_selesai: tanggalSelesai,
          alasan: validData.keluhan,
          status_approval: 'Disetujui',
          id_approver: userLogin,
          tanggal_approval: new Date(),
          is_canceled: false,
          is_request_canceled: false,
          created_by: userLogin,
        };

        const perizinan = await PerizinanSantri.create(perizinanPayload, {
          transaction: trx,
        });
        perizinan_id = perizinan.id_izin;
        izin_auto_created = true;
        sumber_pengajuan = 'Kesehatan';

        const year = moment().tz(TIMEZONE).year();
        const month = moment().tz(TIMEZONE).month();
        const urut = await repository.getNextUrutSurat(year);
        const bulanRomawi = helper.convertToRomawi(month);

        const letterType = isPegawaiPatient ? 'IZN-PEG' : 'IZN-SAN';
        const nomorSurat = `${String(urut).padStart(3, '0')}/${letterType}/${codeUnit}/${bulanRomawi}/${year}`;

        await SuratPerizinanSantri.create(
          {
            id_izin: perizinan_id,
            urut,
            tahun: year,
            kode_unit: codeUnit,
            nomor_surat: nomorSurat,
            qrcode_token: `QR-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now()}`,
            tanggal_cetak: new Date(),
            dicetak_oleh: userLogin,
            versi_surat: 1,
            status_surat: 'Aktif',
          },
          { transaction: trx }
        );
      }

      if (
        isPegawaiPatient &&
        (validData.progres_status == 'Dirawat' ||
          validData.progres_status == 'Dirujuk')
      ) {
        const jamKerjaMaster = await JamKerjaPegawaiRepository.detail({
          id_pegawai: validData.id_pegawai,
        });
        if (jamKerjaMaster) {
          const idJamKerja =
            jamKerjaMaster?.dataValues?.id_jamkerja ||
            jamKerjaMaster?.id_jamkerja ||
            1;

          const dateStartStr =
            validData.progres_status == 'Dirawat'
              ? validData.tanggal_mulai_rawat
              : validData.tanggal_dirujuk;
          const start = moment(dateStartStr);
          const end = moment(dateStartStr).add(
            (validData.estimasi_hari || 0) as number,
            'days'
          );

          const userLogin = req?.user?.id || 'ADMIN';

          while (start.isSameOrBefore(end)) {
            const tanggalTarget = start.format('YYYY-MM-DD');

            const existingAbsen = await AbsenHarianPegawaiRepository.detail({
              id_pegawai: validData.id_pegawai,
              tanggal: tanggalTarget,
              id_jamkerja: idJamKerja,
            });

            const dataPayload = {
              id_jamkerja: idJamKerja,
              id_pegawai: validData.id_pegawai,
              tanggal: tanggalTarget,
              waktu_masuk: jamKerjaMaster.waktu_mulai,
              keterangan_masuk: `Sakit (${validData.progres_status}): ${validData.keluhan || 'Pemeriksaan Kesehatan'}`,
              waktu_keluar: jamKerjaMaster.waktu_selesai,
              keterangan_keluar: `Sakit (${validData.progres_status}): ${validData.keluhan || 'Pemeriksaan Kesehatan'}`,
              status_kehadiran: 'Sakit',
              created_by: userLogin,
            };

            if (!existingAbsen) {
              await AbsenHarianPegawaiRepository.create([dataPayload], trx);
            } else {
              await AbsenHarianPegawaiRepository.update(
                {
                  payload: {
                    status_kehadiran: 'Sakit',
                    waktu_keluar: moment().tz(TIMEZONE).format('HH:mm:ss'),
                    keterangan_keluar: `Sakit (${validData.progres_status}): ${validData.keluhan || 'Pemeriksaan Kesehatan'}`,
                    updated_by: userLogin,
                  },
                  condition: { id_absen: existingAbsen.id_absen },
                },
                trx
              );
            }

            start.add(1, 'days');
          }
        }
      }

      const kesehatanPayload = {
        ...validData,
        id_petugas,
        perizinan_id,
        izin_auto_created,
        sumber_pengajuan,
        tanggal_event: validData.tanggal_event
          ? new Date(validData.tanggal_event)
          : new Date(),
        tanggal_mulai_rawat: validData.tanggal_mulai_rawat
          ? new Date(validData.tanggal_mulai_rawat)
          : null,
        tanggal_dirujuk: validData.tanggal_dirujuk
          ? new Date(validData.tanggal_dirujuk)
          : null,
      };
      const dataInsert: Object = helper.only(
        variable.fillable(),
        kesehatanPayload
      );

      const result = await repository.create(dataInsert, trx);
      await trx?.commit();

      return response.success(SUCCESS_SAVED, result, res);
    } catch (err: any) {
      await trx?.rollback();
      const msg =
        err instanceof z.ZodError
          ? `Validasi Gagal: ${err.issues[0].message}`
          : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const check = await repository.detail({ id_kesehatan: id });
      if (!check) {
        return response.success(NOT_FOUND, null, res, false);
      }

      if (check.perizinan_id || check.izin_auto_created) {
        return response.success(
          'Event kesehatan yang telah memicu perizinan tidak boleh diubah.',
          null,
          res,
          false
        );
      }

      const validData = updateKesehatanSchema.parse(req.body);
      const dataUpdate: Object = helper.only(variable.fillable(), validData);

      await repository.update(
        {
          ...dataUpdate,
          updated_at: helper.date(),
        },
        { id_kesehatan: id }
      );

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      const msg =
        err instanceof z.ZodError
          ? `Validasi Gagal: ${err.issues[0].message}`
          : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const check = await repository.detail({ id_kesehatan: id });
      if (!check) {
        return response.success(NOT_FOUND, null, res, false);
      }

      if (check.perizinan_id || check.izin_auto_created) {
        return response.success(
          'Event kesehatan yang telah memicu perizinan tidak boleh dihapus.',
          null,
          res,
          false
        );
      }

      await repository.update(
        {
          is_deleted: true,
          deleted_at: new Date(),
        },
        { id_kesehatan: id }
      );

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(err.message, 400, res);
    }
  }

  public async export(req: Request, res: Response) {
    try {
      const {
        progres_status,
        kategori_sakit,
        id_santri,
        id_pegawai,
        tanggal_awal,
        tanggal_akhir,
        subject_type,
        keyword,
        q,
      } = req.body;
      const filterData = {
        page: 1,
        perPage: 100000, // Fetch all matching records
        progres_status,
        kategori_sakit,
        id_santri,
        id_pegawai,
        tanggal_awal,
        tanggal_akhir,
        subject_type,
        keyword: keyword || q,
      };

      const result = await repository.index(filterData);
      const rows = result.values || [];

      const { dir, path } = await helper.checkDirExport('excel');
      const label =
        subject_type === 'santri'
          ? 'Santri'
          : subject_type === 'pegawai'
            ? 'Pegawai'
            : 'Santri-Pegawai';
      const filename = `kesehatan-${label}-${moment().tz(TIMEZONE).format('DDMMYYYY-HHmmss')}.xlsx`;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(
        `LAPORAN KESEHATAN ${label.toUpperCase()}`
      );

      generateDataExcel(sheet, rows);
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success(
        'export excel kesehatan',
        `${dir}/${filename}`,
        res
      );
    } catch (err: any) {
      return helper.catchError(
        `export excel kesehatan: ${err.message}`,
        500,
        res
      );
    }
  }
}

export const controller = new KesehatanSantriController();
