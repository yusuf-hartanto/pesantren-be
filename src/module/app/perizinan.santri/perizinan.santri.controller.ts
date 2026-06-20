'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { response } from '../../../helpers/response';
import { repository } from './perizinan.santri.repository';
import { variable } from './perizinan.santri.variable';
import {
  pengajuanIzinSchema,
  approvalIzinSchema,
} from './perizinan.santri.schema';
import PerizinanSantri from './perizinan.santri.model';
import {
  NOT_FOUND,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import moment from 'moment';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import { request } from 'http';

export default class Controller {
  constructor() {
    this.index = this.index.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.approve = this.approve.bind(this);
    this.cancel = this.cancel.bind(this);
    this.detail = this.detail.bind(this);
    this.requestPembatalan = this.requestPembatalan.bind(this);
    this.scanQrGate = this.scanQrGate.bind(this);
    this.export = this.export.bind(this);
    this.import = this.import.bind(this);
  }

  /**
   * Helper konversi angka bulan ke format romawi untuk penomoran surat
   */
  private convertToRomawi(month: number): string {
    const romawi = [
      'I',
      'II',
      'III',
      'IV',
      'V',
      'VI',
      'VII',
      'VIII',
      'IX',
      'X',
      'XI',
      'XII',
    ];
    return romawi[month - 1] || 'I';
  }

  /**
   * Helper: generateDataExcel
   * Menyusun struktur layout kolom, styling header, pengisian data, dan border file Excel
   */
  private generateDataExcel(
    sheet: any,
    details: any,
    isTemplate: boolean = false
  ) {
    // Definisikan susunan teks header persis di baris pertama
    sheet.addRow([
      'No',
      'ID Santri',
      'NIS',
      'Nama Santri',
      'ID Kamar',
      'Nama Kamar',
      'Unit/Kode Kamar',
      'Sumber Pengajuan',
      'Jenis Izin',
      'Kondisi',
      'Tanggal Mulai',
      'Tanggal Selesai',
      'Alasan',
      'Status Approval',
    ]);

    // Set property metadata kolom (width disesuaikan agar proporsional)
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'ID Santri', key: 'id_santri', width: 20 },
      { header: 'NIS', key: 'nis', width: 15 },
      { header: 'Nama Santri', key: 'nama_santri', width: 30 },
      { header: 'ID Kamar', key: 'id_lokasi_kamar', width: 20 },
      { header: 'Nama Kamar', key: 'nama_kamar', width: 25 },
      { header: 'Unit/Kode Kamar', key: 'kode_unit', width: 18 },
      { header: 'Sumber Pengajuan', key: 'sumber_pengajuan', width: 20 },
      { header: 'Jenis Izin', key: 'jenis_izin', width: 15 },
      { header: 'Kondisi', key: 'kondisi', width: 15 },
      { header: 'Tanggal Mulai', key: 'tanggal_mulai', width: 15 },
      { header: 'Tanggal Selesai', key: 'tanggal_selesai', width: 15 },
      { header: 'Alasan', key: 'alasan', width: 40 },
      { header: 'Status Approval', key: 'status_approval', width: 18 },
    ];

    // Styling Header Baris Pertama
    sheet.getRow(1).eachCell((cell: any) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    });

    // Perulangan Data menggunakan gaya indeks array (for...in) & Logika IsTemplate
    for (let i in details) {
      sheet.addRow([
        parseInt(i) + 1,
        details[i]?.id_santri || '',
        details[i]?.santri?.nis || '',
        details[i]?.santri?.fullname || '',
        details[i]?.id_lokasi_kamar || '',
        details[i]?.lokasiKamar?.nama_lokasi || '',
        details[i]?.lokasiKamar?.kode_lokasi || '',
        details[i]?.sumber_pengajuan || 'Orang Tua',
        details[i]?.jenis_izin || 'Izin',
        details[i]?.kondisi || 'Sehat',
        details[i]?.tanggal_mulai
          ? moment(details[i].tanggal_mulai).format('YYYY-MM-DD')
          : '',
        details[i]?.tanggal_selesai
          ? moment(details[i].tanggal_selesai).format('YYYY-MM-DD')
          : '',
        details[i]?.alasan || '',
        details[i]?.status_approval || 'Menunggu',
      ]);
    }

    // Pemberian Border secara paksa ke seluruh cell yang aktif
    const columnCount = sheet.columns.length;
    for (let row = 1; row <= (details?.length || 0) + 1; row++) {
      const currentRow = sheet.getRow(row);
      for (let col = 1; col <= columnCount; col++) {
        const cell = currentRow.getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
      }
    }

    return sheet;
  }

  /**
   * 2. Helper: normalizeRow
   * Mengonversi objek baris dari file Excel menjadi objek data yang bersih
   */
  private normalizeRow(row: any) {
    return {
      id_santri: String(row['ID Santri'] || '').trim(),
      nis: String(row['NIS'] || '').trim(),
      nama_santri: String(row['Nama Santri'] || '').trim(),
      id_lokasi_kamar: String(row['ID Kamar'] || '').trim(),
      nama_kamar: String(row['Nama Kamar'] || '').trim(),
      kode_unit: String(row['Unit/Kode Kamar'] || '').trim(),
      sumber_pengajuan: String(row['Sumber Pengajuan'] || 'Orang Tua').trim(),
      jenis_izin: String(row['Jenis Izin'] || 'Izin').trim(),
      kondisi: String(row['Kondisi'] || 'Sehat').trim(),
      tanggal_mulai: row['Tanggal Mulai'] || null,
      tanggal_selesai: row['Tanggal Selesai'] || null,
      alasan: String(row['Alasan'] || '').trim(),
      status_approval: String(row['Status Approval'] || 'Menunggu').trim(),
      __row: row.__row,
    };
  }

  /**
   * 3. Helper: validateRow
   * Memvalidasi isi kolom per baris data perizinan hasil import
   */
  private validateRow(row: any) {
    const errors: string[] = [];

    if (!row.id_santri) errors.push('ID Santri wajib diisi');
    if (!row.id_lokasi_kamar) errors.push('ID Kamar wajib diisi');
    if (!row.alasan) errors.push('Alasan izin wajib diisi');
    if (!row.tanggal_mulai) errors.push('Tanggal Mulai wajib diisi');
    if (!row.tanggal_selesai) errors.push('Tanggal Selesai wajib diisi');

    if (row.tanggal_mulai && row.tanggal_selesai) {
      const formatSesuai = 'YYYY-MM-DD';
      const validMulai = moment(
        row.tanggal_mulai,
        formatSesuai,
        true
      ).isValid();
      const validSelesai = moment(
        row.tanggal_selesai,
        formatSesuai,
        true
      ).isValid();

      if (!validMulai)
        errors.push('Format Tanggal Mulai tidak valid (Gunakan YYYY-MM-DD)');
      if (!validSelesai)
        errors.push('Format Tanggal Selesai tidak valid (Gunakan YYYY-MM-DD)');

      if (validMulai && validSelesai) {
        if (moment(row.tanggal_selesai).isBefore(moment(row.tanggal_mulai))) {
          errors.push(
            'Tanggal Selesai harus lebih besar atau sama dengan tanggal mulai'
          );
        }
      }
    }

    const allowedJenis = ['Izin', 'Sakit'];
    if (!allowedJenis.includes(row.jenis_izin)) {
      errors.push(
        `Jenis Izin harus berupa salah satu dari: ${allowedJenis.join(', ')}`
      );
    }

    return errors;
  }

  /**
   * Fungsi menampilkan list perizinan santri dengan multi-filter & search keyword
   */
  public async index(req: Request, res: Response) {
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
        kondisi: req.query.kondisi,
      };

      const { count, rows } = await repository.index(filter);
      if (rows?.length < 1)
        return response.success(NOT_FOUND, null, res, false);

      return response.success(
        SUCCESS_RETRIEVED,
        { total: count, values: rows },
        res
      );
    } catch (err: any) {
      console.log('Error PerizinanSantriController.index:', err);
      return helper.catchError(
        `PerizinanSantri index: ${err?.message}`,
        500,
        res
      );
    }
  }

  /**
   * Fungsi mengajukan perizinan baru
   */
  public async create(req: Request, res: Response) {
    try {
      const validData = pengajuanIzinSchema.parse(req.body);

      if (
        moment(validData.tanggal_selesai).isBefore(
          moment(validData.tanggal_mulai)
        )
      ) {
        throw new Error(
          'Tanggal selesai harus lebih besar dari tanggal mulai.'
        );
      }

      const hasActive = await repository.checkActiveLicense(
        validData.id_santri
      );
      if (hasActive) {
        throw new Error(
          'Santri masih memiliki pengajuan aktif berkriteria Menunggu / Sedang Disetujui saat ini.'
        );
      }

      let file_izin: any = null;
      if (req?.files && req?.files.file_izin) {
        const fileIzin = req?.files?.file_izin;
        const checkFileIzin = helper.checkExtention(fileIzin, 'all');
        if (checkFileIzin != 'allowed')
          return response.failed(checkFileIzin, 422, res);

        file_izin = await helper.upload(
          fileIzin,
          'perizinan-santri',
          req?.user?.username || 'system',
          'local'
        );
      }

      const payload = {
        ...validData,
        tanggal_pengajuan: new Date(),
        file_izin,
        status_approval: 'Menunggu',
        created_by: req?.user?.id || 'SYSTEM',
      };

      const result = await repository.create(payload);
      return response.success(SUCCESS_SAVED, result, res);
    } catch (err: any) {
      const msg =
        err instanceof z.ZodError
          ? `Validasi Gagal: ${err.issues[0].message}`
          : err.message;
      return helper.catchError(msg, 400, res);
    }
  }

  /**
   * Fungsi update data perizinan (Hanya jika status 'Menunggu')
   */
  public async update(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const check = await repository.detail({ id_izin: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      if (check.status_approval !== 'Menunggu') {
        throw new Error(
          'Data perizinan yang sudah diproses tidak dapat diubah kembali.'
        );
      }

      const validData = pengajuanIzinSchema.partial().parse(req.body);

      if (validData.tanggal_mulai || validData.tanggal_selesai) {
        const tMulai = validData.tanggal_mulai || check.tanggal_mulai;
        const tSelesai = validData.tanggal_selesai || check.tanggal_selesai;
        if (moment(tSelesai).isBefore(moment(tMulai))) {
          throw new Error(
            'Tanggal selesai harus lebih besar dari tanggal mulai.'
          );
        }
      }

      let file_izin: any = null;
      if (req?.files && req?.files.file_izin) {
        const fileIzin = req?.files?.file_izin;
        const checkFileIzin = helper.checkExtention(fileIzin, 'all');
        if (checkFileIzin != 'allowed')
          return response.failed(checkFileIzin, 422, res);

        file_izin = await helper.upload(
          fileIzin,
          'perizinan-santri',
          req?.user?.username || 'system',
          'local'
        );
      }

      const finalPayload = helper.only(
        variable.fillable(),
        { ...check.toJSON(), ...validData, ...(file_izin ? { file_izin } : {}) },
        true
      );
      await repository.update(
        { ...finalPayload, updated_at: helper.date() },
        { id_izin: id }
      );

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      return helper.catchError(err.message, 400, res);
    }
  }

  /**
   * Fungsi approve perizinan (Diterima / Ditolak oleh petugas_kedisiplinan)
   */
  public async approve(req: Request, res: Response) {
    if (
      req?.user?.role_name !== 'pegawai_kedisiplinan' &&
      req?.user?.role_name !== 'administrator'
    ) {
      return helper.catchError(
        'Akses Ditolak: Hanya Petugas Kedisiplinan atau Administrator yang dapat memproses instruksi ini.',
        403,
        res
      );
    }

    const trx = await PerizinanSantri.sequelize?.transaction();
    try {
      const id = req.params.id;
      const check = await repository.detail({ id_izin: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      if (check.status_approval !== 'Menunggu' && !check.is_request_canceled)
        throw new Error('Perizinan telah diproses sebelumnya.');

      const body = approvalIzinSchema.parse(req.body);
      const activeUser = req?.user?.id || 'SYSTEM';

      await repository.update(
        {
          status_approval: body.status_approval,
          id_approver: activeUser,
          tanggal_approval: new Date(),
          catatan_approval: body.catatan_approval,
          kondisi: body.status_approval != 'Ditolak' ? 'Normal' : 'Arsip',
          is_request_canceled: false,
        },
        { id_izin: id },
        trx
      );

      if (body.status_approval === 'Disetujui') {
        const tahun = moment().year();
        const urut = await repository.getNextUrutSurat(tahun);
        const codeUnit = check.lokasiKamar?.kode_lokasi || 'IZN';
        const bulanRomawi = this.convertToRomawi(moment().month() + 1);

        const nomorSurat = `${String(urut).padStart(3, '0')}/IZN-SAN/${codeUnit}/${bulanRomawi}/${tahun}`;

        await repository.createSurat(
          {
            id_izin: id,
            urut,
            tahun,
            kode_unit: codeUnit,
            nomor_surat: nomorSurat,
            qrcode_token: `QR-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now()}`,
            tanggal_cetak: new Date(),
            dicetak_oleh: activeUser,
            versi_surat: 1,
            status_surat: 'Aktif',
          },
          trx
        );
      }

      await trx?.commit();
      return response.success(
        'Approval perizinan berhasil diproses',
        null,
        res
      );
    } catch (err: any) {
      await trx?.rollback();
      return helper.catchError(err.message, 400, res);
    }
  }

  /**
   * Fungsi cancel/pembatalan perizinan beserta penarikan surat
   */
  public async cancel(req: Request, res: Response) {
    const trx = await PerizinanSantri.sequelize?.transaction();
    try {
      const id = req.params.id;
      const check = await repository.detail({ id_izin: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      const activeUser = req?.user?.id || 'SYSTEM';
      const userRole = req?.user?.role_name;

      if (check.status_approval === 'Menunggu') {
        // Bisa dibatalkan langsung
      } else if (check.status_approval === 'Disetujui') {
        if (
          userRole !== 'pegawai_kedisiplinan' &&
          userRole !== 'administrator'
        ) {
          throw new Error(
            'Pembatalan izin yang telah disetujui hanya bisa dilakukan oleh Petugas Kedisiplinan atau Administrator.'
          );
        }
      } else {
        throw new Error(
          'Data perizinan yang sudah ditolak tidak perlu dibatalkan.'
        );
      }

      await repository.update(
        {
          is_canceled: true,
          canceled_at: new Date(),
          canceled_by: activeUser,
          kondisi: 'Arsip',
          alasan_penutupan:
            req.body.alasan_penutupan ||
            `Dibatalkan oleh ${userRole == 'administrator' || userRole == 'pegawai_kedisiplinan' ? 'Petugas' : 'Pengguna'}`,
        },
        { id_izin: id },
        trx
      );

      await repository.updateSurat(
        { status_surat: 'Dicabut' },
        { id_izin: id },
        trx
      );

      await trx?.commit();
      return response.success(
        'Perizinan dan dokumen surat berhasil dicabut/dibatalkan.',
        null,
        res
      );
    } catch (err: any) {
      await trx?.rollback();
      return helper.catchError(err.message, 400, res);
    }
  }

  /**
   * Fungsi detail perizinan santri
   */
  public async detail(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result: any = await repository.detail({ id_izin: id });
      if (!result) return response.success(NOT_FOUND, null, res, false);

      const tanggalMulai = result.tanggal_mulai
        ? moment(result.tanggal_mulai).format('DD-MMM-YYYY')
        : '-';
      const tanggalSelesai = result.tanggal_selesai
        ? moment(result.tanggal_selesai).format('DD-MMM-YYYY')
        : '-';

      const formattedDetail = {
        status_izin: result.status_approval,
        nama_santri: result.santri?.fullname || '-',
        nis: result.santri?.nis || '-',
        kamar: result.lokasiKamar?.nama_lokasi || '-',
        jenis_izin: result.jenis_izin,
        tanggal_izin: `${tanggalMulai} s/d ${tanggalSelesai}`,
        sumber_pengajuan: result.sumber_pengajuan,
        alasan: result.alasan,
        petugas_approval: result.approver?.username || '-',
        catatan_approval: result.catatan_approval || '-',
        petugas_yang_membatalkan: result.canceler?.username || '-',
        catatan_pembatalan: result.alasan_penutupan || '-',
        surat_izin: result?.suratPerizinan || '',
        file_izin: result?.file_izin || '',
        is_request_canceled: result.is_request_canceled || false,
        request_canceled_at: result.request_canceled_at
          ? moment(result.request_canceled_at).format('DD-MMM-YYYY HH:mm:ss')
          : '-',
        request_canceled_catatan: result.request_canceled_catatan || '-',
      };

      return response.success(SUCCESS_RETRIEVED, formattedDetail, res);
    } catch (err: any) {
      console.log('Error PerizinanSantriController.detail:', err);
      return helper.catchError(`Detail Perizinan: ${err?.message}`, 500, res);
    }
  }

  /**
   * Fungsi request pembatalan izin aktif oleh santri/wasi
   */
  public async requestPembatalan(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const check = await repository.detail({ id_izin: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      await repository.update(
        {
          is_request_canceled: true,
          request_canceled_at: new Date(),
          request_canceled_catatan: req.body.request_canceled_catatan,
        },
        { id_izin: id }
      );
      return response.success(
        'Permintaan pembatalan izin berhasil dikirim.',
        null,
        res
      );
    } catch (err: any) {
      return helper.catchError(err.message, 500, res);
    }
  }

  /**
   * Fungsi scan QR surat izin di gerbang masuk/keluar pondok (Log Gate)
   */
  public async scanQrGate(req: Request, res: Response) {
    const trx = await PerizinanSantri.sequelize?.transaction();
    try {
      const { qrcode_token } = req.body;
      const surat = await repository.findSuratByToken(qrcode_token);

      if (!surat) {
        throw new Error(
          'QR Code Surat Izin Tidak Valid, Palsu, atau Sudah Dicabut!'
        );
      }

      // Pastikan data relasi perizinan, santri, dan lokasiKamar termuat dari repository
      const perizinan = surat.perizinanSantri;
      if (!perizinan || !perizinan.santri) {
        throw new Error('Data santri terkait perizinan ini tidak ditemukan!');
      }

      const todayStr = moment().format('YYYY-MM-DD');
      const tglSelesaiStr = moment(perizinan.tanggal_selesai).format(
        'YYYY-MM-DD'
      );

      // Validasi kedaluwarsa dokumen surat
      if (moment(todayStr).isAfter(moment(tglSelesaiStr))) {
        throw new Error('Masa aktif surat izin telah habis (Expired)!');
      }

      const id_izin = surat.id_izin;
      const logGate = await repository.findLogGate(id_izin);
      const activePetugasId =
        req?.user?.resource_id || req?.user?.id || 'GATE_KEEPER_ID';

      // Persiapan data profile santri untuk response body
      const profileResponse = {
        nama_santri: perizinan.santri.fullname || '-',
        nis: perizinan.santri.nis || '-',
        kamar: perizinan.lokasiKamar?.nama_lokasi || '-',
        jenis_izin: perizinan.jenis_izin || '-',
        tanggal_mulai: perizinan.tanggal_mulai,
        tanggal_selesai: perizinan.tanggal_selesai,
      };

      // --- 1. SANTRI KELUAR PONDOK (Log Gate Belum Ada) ---
      if (!logGate) {
        const waktuKeluarSekarang = new Date();

        await repository.createLogGate(
          {
            id_gate: uuidv4(),
            id_izin,
            waktu_keluar: waktuKeluarSekarang,
            petugas_keluar: activePetugasId,
            status_gate: 'Keluar',
            keterangan:
              req.body.keterangan ||
              'Santri terverifikasi keluar komplek pondok.',
          },
          trx
        );

        await trx?.commit();

        return response.success(
          'AKSES DIIZINKAN: Santri tercatat KELUAR.',
          {
            ...profileResponse,
            status_gate: 'Keluar',
            waktu_keluar: moment(waktuKeluarSekarang).format(
              'YYYY-MM-DD HH:mm:ss'
            ),
            waktu_masuk: null,
            kondisi: 'Normal',
          },
          res
        );
      }

      // --- 2. SANTRI KEMBALI KE DALAM PONDOK (Log Gate Sudah Ada) ---
      else {
        if (logGate.status_gate === 'Kembali') {
          throw new Error(
            'Santri ini sudah tercatat kembali ke dalam pondok sebelumnya.'
          );
        }

        const waktuMasukSekarang = new Date();

        // Update data log logistik gerbang masuk
        await repository.updateLogGate(
          {
            waktu_masuk: waktuMasukSekarang,
            petugas_masuk: activePetugasId,
            status_gate: 'Kembali',
            keterangan:
              req.body.keterangan ||
              'Santri terverifikasi KEMBALI/MASUK pondok.',
          },
          { id_izin },
          trx
        );

        // Tentukan status kondisi perizinan berdasarkan perbandingan tanggal hari ini & tanggal_selesai
        let kondisiFinal = 'Normal';
        const targetToday = moment(todayStr);
        const targetSelesai = moment(tglSelesaiStr);

        if (targetToday.isAfter(targetSelesai)) {
          kondisiFinal = 'Overdue';
        } else if (targetToday.isBefore(targetSelesai)) {
          kondisiFinal = 'Closed';
        } else {
          kondisiFinal = 'Normal'; // Jika tepat di hari H tanggal_selesai
        }

        // Eksekusi pembaruan kolom kondisi ke tabel perizinan_santri
        await repository.update(
          {
            kondisi: kondisiFinal,
            updated_at: new Date(),
          },
          { id_izin },
          trx
        );

        // Commit seluruh rangkaian transaksi database jika sukses tanpa hambatan
        await trx?.commit();

        return response.success(
          `AKSES DIIZINKAN: Santri tercatat KEMBALI. Kondisi perizinan: [${kondisiFinal}]`,
          {
            ...profileResponse,
            status_gate: 'Kembali',
            waktu_keluar: logGate.waktu_keluar
              ? moment(logGate.waktu_keluar).format('YYYY-MM-DD HH:mm:ss')
              : '-',
            waktu_masuk: moment(waktuMasukSekarang).format(
              'YYYY-MM-DD HH:mm:ss'
            ),
            kondisi: kondisiFinal,
          },
          res
        );
      }
    } catch (err: any) {
      // Batalkan perubahan jika ada error di tengah jalan
      await trx?.rollback();
      return helper.catchError(err.message, 400, res);
    }
  }

  public async scanCardGate(req: Request, res: Response) {
    const trx = await PerizinanSantri.sequelize?.transaction();
    try {
      const { nomor_kartu_santri } = req.body;

      if (!nomor_kartu_santri) {
        throw new Error('Nomor kartu santri tidak boleh kosong!');
      }

      // Cari perizinan santri aktif yang berjalan hari ini berdasarkan nomor kartu
      const perizinan = await repository.findActiveIzinByCardNumber(nomor_kartu_santri);

      if (!perizinan) {
        throw new Error(
          'Akses Ditolak: Santri tidak memiliki dokumen perizinan aktif yang sah untuk hari ini!'
        );
      }

      const perizinanSantriData = perizinan.santri;
      if (!perizinanSantriData) {
        throw new Error('Struktur data profil santri tidak ditemukan!');
      }

      const todayStr = moment().format('YYYY-MM-DD');
      const tglSelesaiStr = moment(perizinan.tanggal_selesai).format('YYYY-MM-DD');

      const id_izin = perizinan.id_izin;
      const logGate = await repository.findLogGate(id_izin);
      const activePetugasId = req?.user?.resource_id || req?.user?.id || 'GATE_KEEPER_ID';

      // Persiapan payload profile untuk response JSON ke UI client
      const profileResponse = {
        nama_santri: perizinanSantriData.fullname || '-',
        nis: perizinanSantriData.nis || '-',
        kamar: perizinan.lokasiKamar?.nama_lokasi || '-',
        jenis_izin: perizinan.jenis_izin || '-',
        tanggal_mulai: perizinan.tanggal_mulai,
        tanggal_selesai: perizinan.tanggal_selesai,
      };

      // --- KONDISI A: SANTRI KELUAR PONDOK (Log Gate Belum Ada) ---
      if (!logGate) {
        const waktuKeluarSekarang = new Date();

        await repository.createLogGate(
          {
            id_gate: uuidv4(),
            id_izin,
            waktu_keluar: waktuKeluarSekarang,
            petugas_keluar: activePetugasId,
            status_gate: 'Keluar',
            keterangan:
              req.body.keterangan || 'Santri keluar komplek pondok via tapping kartu.',
          },
          trx
        );

        await trx?.commit();

        return response.success(
          'AKSES DIIZINKAN: Santri tercatat KELUAR.',
          {
            ...profileResponse,
            status_gate: 'Keluar',
            waktu_keluar: moment(waktuKeluarSekarang).format('YYYY-MM-DD HH:mm:ss'),
            waktu_masuk: null,
            kondisi: 'Normal',
          },
          res
        );
      }

      // --- SANTRI KEMBALI KE DALAM PONDOK (Log Gate Sudah Ada) ---
      else {
        // Karena tidak menggunakan status_gate, cek ketersediaan waktu_masuk
        if (logGate.waktu_masuk) {
          throw new Error(
            'Akses Ditolak: Santri dengan kartu ini sudah tercatat kembali ke dalam pondok sebelumnya.'
          );
        }

        const waktuMasukSekarang = new Date();

        // Update log gerbang masuk pondok
        await repository.updateLogGate(
          {
            waktu_masuk: waktuMasukSekarang,
            petugas_masuk: activePetugasId,
            status_gate: 'Kembali',
            keterangan:
              req.body.keterangan || 'Santri kembali masuk pondok via tapping kartu.',
          },
          { id_izin },
          trx
        );

        // Kalkulasi ketepatan waktu pengembalian
        let kondisiFinal = 'Normal';
        const targetToday = moment(todayStr);
        const targetSelesai = moment(tglSelesaiStr);

        if (targetToday.isAfter(targetSelesai)) {
          kondisiFinal = 'Overdue';
        } else if (targetToday.isBefore(targetSelesai)) {
          kondisiFinal = 'Closed';
        } else {
          kondisiFinal = 'Normal';
        }

        // Simpan status final ke master perizinan santri
        await repository.update(
          {
            kondisi: kondisiFinal,
            updated_at: new Date(),
          },
          { id_izin },
          trx
        );

        await trx?.commit();

        return response.success(
          `AKSES DIIZINKAN: Santri tercatat KEMBALI. Kondisi: [${kondisiFinal}]`,
          {
            ...profileResponse,
            status_gate: 'Kembali',
            waktu_keluar: logGate.waktu_keluar
              ? moment(logGate.waktu_keluar).format('YYYY-MM-DD HH:mm:ss')
              : '-',
            waktu_masuk: moment(waktuMasukSekarang).format('YYYY-MM-DD HH:mm:ss'),
            kondisi: kondisiFinal,
          },
          res
        );
      }
    } catch (err: any) {
      await trx?.rollback();
      return helper.catchError(err.message, 400, res);
    }
  }

  /**
   * Fungsi Export data perizinan santri / download template
   */
  public async export(req: Request, res: Response) {
    try {
      const {
        keyword,
        status_approval,
        jenis_izin,
        start_date,
        end_date,
        template,
      } = req.body;
      const isTemplate: boolean = template && template == '1';

      const result = await repository.listForExport({
        keyword,
        status_approval,
        jenis_izin,
        start_date,
        end_date,
        isTemplate,
      });

      const workbook = new ExcelJS.Workbook();
      let sheet = workbook.addWorksheet('DATA PERIZINAN SANTRI');

      // Memanggil fungsi helper internal generateDataExcel
      sheet = this.generateDataExcel(sheet, result, isTemplate);

      const { dir, path } = await helper.checkDirExport('excel');
      const filename = `perizinan-santri-${isTemplate ? 'template' : moment().format('DDMMYYYY-HHmmss')}.xlsx`;
      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success(
        `export excel perizinan ${isTemplate ? 'template' : 'data'}`,
        `${dir}/${filename}`,
        res
      );
    } catch (err: any) {
      console.log('Error PerizinanSantriController.export:', err);
      return helper.catchError(
        `export excel perizinan: ${err?.message}`,
        500,
        res
      );
    }
  }

  /**
   * Fungsi Import data perizinan massal dari file excel (Preview & Commit)
   */
  public async import(req: Request, res: Response) {
    const mode: 'preview' | 'commit' = req.body?.mode ?? 'preview';
    const uploaded = req.files?.file_import;
    if (!uploaded)
      return response.success('File import tidak ditemukan', null, res, false);

    try {
      const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      const buffer = file.tempFilePath
        ? await fs.readFile(file.tempFilePath)
        : file.data;

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const sheet = workbook.getWorksheet(1);

      const rawRows: any[] = [];
      const activeUser = req?.user?.resource_id || 'SYSTEM';

      // Ekstrak data kasar dari Excel
      sheet?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip Header

        const rawRowData: Record<string, any> = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const headerCell = sheet.getRow(1).getCell(colNumber).value;
          if (headerCell) {
            rawRowData[String(headerCell).trim()] = cell.value;
          }
        });
        rawRowData.__row = rowNumber;
        rawRows.push(rawRowData);
      });

      // Proses sanitasi, validasi dasar, dan pengecekan database secara paralel
      const results = await Promise.all(
        rawRows.map(async (rawRowData) => {
          const rowNumber = rawRowData.__row;
          const cleanData = this.normalizeRow(rawRowData);

          const errors = this.validateRow(cleanData);

          // Validasi Logika Jarak Tanggal
          if (cleanData.tanggal_mulai && cleanData.tanggal_selesai) {
            if (
              moment(cleanData.tanggal_selesai).isBefore(
                moment(cleanData.tanggal_mulai)
              )
            ) {
              errors.push(
                'Tanggal selesai harus lebih besar atau sama dengan tanggal mulai'
              );
            }
          }

          // Validasi Cek Perizinan Aktif di Database
          if (cleanData.id_santri) {
            try {
              const hasActive = await repository.checkActiveLicense(
                cleanData.id_santri
              );
              if (hasActive) {
                errors.push(
                  'Santri masih memiliki pengajuan aktif berkriteria Menunggu / Sedang Disetujui saat ini'
                );
              }
            } catch (dbErr) {
              errors.push('Gagal memverifikasi status aktif perizinan santri');
            }
          }

          const payload = {
            id_izin: uuidv4(),
            id_santri: cleanData.id_santri || null,
            id_lokasi_kamar: cleanData.id_lokasi_kamar || null,
            sumber_pengajuan: cleanData.sumber_pengajuan,
            jenis_izin: cleanData.jenis_izin,
            kondisi: cleanData.kondisi,
            tanggal_pengajuan: new Date(),
            tanggal_mulai: cleanData.tanggal_mulai
              ? moment(cleanData.tanggal_mulai).format('YYYY-MM-DD')
              : null,
            tanggal_selesai: cleanData.tanggal_selesai
              ? moment(cleanData.tanggal_selesai).format('YYYY-MM-DD')
              : null,
            alasan: cleanData.alasan,
            status_approval: cleanData.status_approval || 'Menunggu', // Mengikuti status approval dari excel jika diatur
            created_by: activeUser,
            kode_unit: cleanData.kode_unit || 'IZN', // Menyimpan kode unit asrama untuk kebutuhan penomoran surat
          };

          return {
            row: rowNumber,
            valid: errors.length === 0,
            error: errors.join(' | ') || null,
            payload,
          };
        })
      );

      // Kalkulasi Ringkasan Data Analisis
      const summary = {
        mode,
        total: results.length,
        valid: results.filter((r) => r.valid).length,
        invalid: results.filter((r) => !r.valid).length,
      };

      // Jalankan Blok Mode COMMIT dengan dukungan transaksi penuh
      if (mode === 'commit') {
        const validPayloads = results
          .filter((r) => r.valid)
          .map((r) => r.payload);

        if (validPayloads.length > 0) {
          const trx = await PerizinanSantri.sequelize?.transaction();
          try {
            // Bulk insert data perizinan yang valid
            await repository.insertImport(validPayloads);

            // Sinkronisasi otomatis dokumen surat izin per baris data
            for (const item of validPayloads) {
              // Syarat Tambah Surat Izin: Status disetujui dan tidak dibatalkan
              if (item.status_approval === 'Disetujui') {
                const tahun = item.tanggal_mulai
                  ? moment(item.tanggal_mulai).year()
                  : moment().year();
                const urut = await repository.getNextUrutSurat(tahun);
                const codeUnit = item.kode_unit || 'IZN';
                const bulanRomawi = this.convertToRomawi(
                  item.tanggal_mulai
                    ? moment(item.tanggal_mulai).month() + 1
                    : moment().month() + 1
                );
                const nomorSurat = `${String(urut).padStart(3, '0')}/IZN-SAN/${codeUnit}/${bulanRomawi}/${tahun}`;

                await repository.createSurat(
                  {
                    id_izin: item.id_izin,
                    urut,
                    tahun,
                    kode_unit: codeUnit,
                    nomor_surat: nomorSurat,
                    qrcode_token: `QR-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now()}`,
                    tanggal_cetak: new Date(),
                    dicetak_oleh: activeUser,
                    versi_surat: 1,
                    status_surat: 'Aktif',
                  },
                  trx
                );
              }
            }

            // Commit semua data ke database jika loop berhasil tanpa hambatan
            await trx?.commit();
          } catch (errorTrx: any) {
            // Batalkan semua perubahan jika salah satu langkah gagal
            await trx?.rollback();
            throw new Error(
              `Gagal menyimpan data transaksi batch import: ${errorTrx.message}`
            );
          }
        }
        return response.success(
          'Import data perizinan massal berhasil dimasukkan beserta pembuatan dokumen surat terkait',
          summary,
          res
        );
      }

      // Mode PREVIEW: Kembalikan log analisis
      return response.success(
        'Preview Analisis Data Import Perizinan',
        { ...summary, data: results },
        res
      );
    } catch (err: any) {
      return helper.catchError(`Import Gagal: ${err?.message}`, 500, res);
    }
  }

  public insert = async (req: Request, res: Response) => {
    const payloads = req.body?.data as any[];
    if (!payloads || payloads.length === 0) {
      return response.success('Data kosong', null, res, false);
    }

    // Menggunakan transaksi agar proses insert aman jika terjadi error di tengah jalan
    const trx = await PerizinanSantri.sequelize?.transaction();
    try {
      const activeUser = req?.user?.resource_id || 'SYSTEM';

      // Jalankan bulk insert data perizinan utama terlebih dahulu
      await repository.insertImport(payloads);

      // Iterasi untuk memproses Surat Izin (Tambah atau Cabut) secara kondisional
      for (const item of payloads) {
        // --- Tambah Surat Izin jika status_approval langsung 'Disetujui' ---
        if (item.status_approval === 'Disetujui' && !item.is_canceled) {
          const tahun = item.tanggal_mulai
            ? moment(item.tanggal_mulai).year()
            : moment().year();
          const urut = await repository.getNextUrutSurat(tahun);

          // Mengambil kode unit dari parameter objek atau default ke 'IZN' jika tidak tersedia
          const codeUnit = item.kode_unit || 'IZN';
          const bulanRomawi = this.convertToRomawi(
            item.tanggal_mulai
              ? moment(item.tanggal_mulai).month() + 1
              : moment().month() + 1
          );
          const nomorSurat = `${String(urut).padStart(3, '0')}/IZN-SAN/${codeUnit}/${bulanRomawi}/${tahun}`;

          await repository.createSurat(
            {
              id_izin: item.id_izin,
              urut,
              tahun,
              kode_unit: codeUnit,
              nomor_surat: nomorSurat,
              qrcode_token: `QR-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now()}`,
              tanggal_cetak: new Date(),
              dicetak_oleh: activeUser,
              versi_surat: 1,
              status_surat: 'Aktif',
            },
            trx
          );
        }

        // --- Cabut Surat Izin jika di-import dengan bendera 'is_canceled' true ---
        if (item.is_canceled === true || item.is_canceled === 'true') {
          // Mengubah status dokumen surat yang berelasi dengan id_izin ini menjadi 'Dicabut'
          await repository.updateSurat(
            { status_surat: 'Dicabut' },
            { id_izin: item.id_izin },
            trx
          );
        }
      }

      // Commit semua transaksi jika tidak ada error
      await trx?.commit();

      return response.success(
        'Import batch berhasil disimpan beserta sinkronisasi dokumen surat',
        { count: payloads.length },
        res
      );
    } catch (err: any) {
      // Rollback jika salah satu baris atau pembuatan surat gagal
      await trx?.rollback();
      return helper.catchError(`Insert Batch Gagal: ${err.message}`, 500, res);
    }
  };
}

export const PerizinanSantriController = new Controller();
