'use strict';

import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { response } from '../../../helpers/response';
import { repository } from './perizinan.santri.repository';
import { repository as JamKerjaPegawaiRepository } from '../pegawai.jam.kerja/pegawai.jam.kerja.repository'
import { repository as AbsenHarianPegawaiRepository } from '../pegawai.absen.harian/pegawai.absen.harian.repository'
import { repository as suratIzinRepository } from '../surat.perizinan.santri/surat.perizinan.santri.repository'
import { repository as LogGateRepository } from '../log.gate.santri/log.gate.santri.repository'
import { repository as paramRepository } from '../param.global/param.global.repository'
import { repository as santriRepository } from '../santri/santri.repository';
import { repository as pegawaiRepository } from '../pegawai/pegawai.repository';
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
import * as FileSystem from 'fs';
import path from 'path';

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
   * Helper: generateDataExcel
   * Menyusun struktur layout kolom, styling header, pengisian data, dan border file Excel
   */
  private generateDataExcel(
    sheet: any,
    details: any,
    isTemplate: boolean = false,
    isPegawai: boolean = false
  ) {
    // Definisikan susunan teks header persis di baris pertama
    const headers = isPegawai
      ? [
          'No',
          'ID Pegawai',
          'NIP',
          'Nama Pegawai',
          'ID Lokasi Kerja',
          'Nama Lokasi Kerja',
          'Unit/Kode Lokasi',
          'Sumber Pengajuan',
          'Jenis Izin',
          'Kondisi',
          'Tanggal Mulai',
          'Tanggal Selesai',
          'Alasan',
          'Status Approval',
        ]
      : [
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
        ];

    sheet.addRow(headers);

    // Set property metadata kolom (width disesuaikan agar proporsional)
    sheet.columns = [
      { header: headers[0], key: 'no', width: 5 },
      { header: headers[1], key: 'id_subjek', width: 20 },
      { header: headers[2], key: 'nomor_induk', width: 15 },
      { header: headers[3], key: 'nama_subjek', width: 30 },
      { header: headers[4], key: 'id_lokasi', width: 20 },
      { header: headers[5], key: 'nama_lokasi', width: 25 },
      { header: headers[6], key: 'kode_lokasi', width: 18 },
      { header: headers[7], key: 'sumber_pengajuan', width: 20 },
      { header: headers[8], key: 'jenis_izin', width: 15 },
      { header: headers[9], key: 'kondisi', width: 15 },
      { header: headers[10], key: 'tanggal_mulai', width: 15 },
      { header: headers[11], key: 'tanggal_selesai', width: 15 },
      { header: headers[12], key: 'alasan', width: 40 },
      { header: headers[13], key: 'status_approval', width: 18 },
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
      const rowData = details[i];

      // Ekstraksi data murni memanfaatkan parameter isPegawai
      const idSubjek = isPegawai ? rowData?.id_pegawai : rowData?.id_santri;
      const nomorInduk = isPegawai
        ? rowData?.pegawai?.nip
        : rowData?.santri?.nis;
      const namaSubjek = isPegawai
        ? rowData?.pegawai?.nama_lengkap
        : rowData?.santri?.fullname;

      const idLokasi = isPegawai
        ? rowData?.id_lokasi_kerja
        : rowData?.id_lokasi_kamar;
      const namaLokasi = isPegawai
        ? rowData?.lokasiKerja?.nama_lokasi
        : rowData?.lokasiKamar?.nama_lokasi;
      const kodeLokasi = isPegawai
        ? rowData?.lokasiKerja?.kode_lokasi
        : rowData?.lokasiKamar?.kode_lokasi;

      sheet.addRow([
        parseInt(i) + 1,
        idSubjek || '',
        nomorInduk || '',
        namaSubjek || '',
        idLokasi || '',
        namaLokasi || '',
        kodeLokasi || '',
        rowData?.sumber_pengajuan || (isPegawai ? 'Pegawai' : 'Orang Tua'),
        rowData?.jenis_izin || 'Izin',
        rowData?.kondisi || 'Sehat',
        rowData?.tanggal_mulai
          ? moment(rowData.tanggal_mulai).format('YYYY-MM-DD')
          : '',
        rowData?.tanggal_selesai
          ? moment(rowData.tanggal_selesai).format('YYYY-MM-DD')
          : '',
        rowData?.alasan || '',
        rowData?.status_approval || 'Menunggu',
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
   *  Helper: normalizeRow
   * Mengonversi objek baris dari file Excel menjadi objek data yang bersih
   */
  private normalizeRow(row: any, isPegawai: boolean = false) {
    return {
      // Data Identitas Subjek (Dipetakan berdasarkan parameter isPegawai)
      id_santri: !isPegawai ? String(row['ID Santri'] || '').trim() : null,
      id_pegawai: isPegawai ? String(row['ID Pegawai'] || '').trim() : null,
      nis: !isPegawai ? String(row['NIS'] || '').trim() : null,
      nip: isPegawai ? String(row['NIP'] || '').trim() : null,
      nama_subjek: isPegawai
        ? String(row['Nama Pegawai'] || '').trim()
        : String(row['Nama Santri'] || '').trim(),

      // Data Lokasi
      id_lokasi_kamar: !isPegawai ? String(row['ID Kamar'] || '').trim() : null,
      id_lokasi_kerja: isPegawai
        ? String(row['ID Lokasi Kerja'] || '').trim()
        : null,
      nama_lokasi: isPegawai
        ? String(row['Nama Lokasi Kerja'] || '').trim()
        : String(row['Nama Kamar'] || '').trim(),
      kode_lokasi: isPegawai
        ? String(row['Unit/Kode Lokasi'] || '').trim()
        : String(row['Unit/Kode Kamar'] || '').trim(),

      // Data Atribut Perizinan Umum
      sumber_pengajuan: String(
        row['Sumber Pengajuan'] || (isPegawai ? 'Pegawai' : 'Orang Tua')
      ).trim(),
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
   * Helper: validateRow
   * Memvalidasi isi kolom per baris data perizinan hasil import
   */
  private validateRow(row: any, isPegawai: boolean = false) {
    const errors: string[] = [];

    // Validasi Jalur Kritis Data Pegawai
    if (isPegawai) {
      if (!row.id_pegawai) errors.push('ID Pegawai wajib diisi');
      if (!row.id_lokasi_kerja) errors.push('ID Lokasi Kerja wajib diisi');
    }
    // Validasi Jalur Kritis Data Santri
    else {
      if (!row.id_santri) errors.push('ID Santri wajib diisi');
      if (!row.id_lokasi_kamar) errors.push('ID Kamar wajib diisi');
    }

    // Validasi Atribut Umum
    if (!row.alasan) errors.push('Alasan izin wajib diisi');
    if (!row.tanggal_mulai) errors.push('Tanggal Mulai wajib diisi');
    if (!row.tanggal_selesai) errors.push('Tanggal Selesai wajib diisi');

    // Validasi Format dan Rentang Waktu Tanggal
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

    // Validasi Kesesuaian ENUM
    const allowedJenis = ['Izin', 'Sakit'];
    if (!allowedJenis.includes(row.jenis_izin)) {
      errors.push(
        `Jenis Izin harus berupa salah satu dari: ${allowedJenis.join(', ')}`
      );
    }

    const allowedSumber = ['Waliasuh', 'Orang Tua', 'Kesehatan', 'Pegawai'];
    if (!allowedSumber.includes(row.sumber_pengajuan)) {
      errors.push(
        `Sumber Pengajuan harus berupa salah satu dari: ${allowedSumber.join(', ')}`
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
        is_pegawai: req.query.is_pegawai === 'true' ? true : false,
        id_lokasi: req.query.id_lokasi,
        id_lembaga: req.query.id_lembaga
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

      const isPegawai = validData.sumber_pengajuan === 'Pegawai';

      if (isPegawai) {
        const hasActive = await repository.checkActiveLicensePegawai(
          validData.id_pegawai as string
        );
        if (hasActive) {
          throw new Error(
            'Pegawai masih memiliki pengajuan aktif berkriteria Menunggu / Sedang Disetujui saat ini.'
          );
        }
      } else {
        const hasActive = await repository.checkActiveLicense(
          validData.id_santri as string, validData.tanggal_mulai as string, validData.tanggal_selesai as string
        );
   
        if (hasActive) {
          const activeData = hasActive?.dataValues
          const logGate = await LogGateRepository.detail({id_izin: activeData?.id_izin});

          if (!logGate || !logGate.dataValues?.waktu_keluar || !logGate.dataValues?.waktu_masuk) {
            throw new Error(
              'Santri masih memiliki pengajuan aktif berkriteria Menunggu / Sedang Disetujui saat ini.'
            );
          }
        }
      }

      let file_izin: any = null;
      if (req?.files && req?.files.file_izin) {
        const fileIzin = req?.files?.file_izin;
        const checkFileIzin = helper.checkExtention(fileIzin, 'all');
        if (checkFileIzin != 'allowed')
          return response.failed(checkFileIzin, 422, res);

        const folderDest = isPegawai ? 'perizinan-pegawai' : 'perizinan-santri';
        file_izin = await helper.upload(
          fileIzin,
          folderDest,
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

      // Send notification
      if (result) {
        const receiver = await helper.receiverByRole(['administrator', 'pegawai_kedisiplinan']);

        let dataMessage: any;
        if (isPegawai) {
          const pegawai = await pegawaiRepository.detail({ id_pegawai: result.id_pegawai });
          dataMessage = {
            title: 'Request Perizinan',
            message: `Terdapat 1 perizinan baru dari pegawai (${pegawai?.nama_lengkap}).`,
            url: `/app/perizinan-pegawai/detail?id=${result.id_izin}`,
            receiver: receiver,
            type: 'Perizinan',
          }
        } else {
          const santri = await santriRepository.detail({ id_santri: result.id_santri });
          dataMessage = {
            title: 'Request Perizinan',
            message: `Terdapat 1 perizinan baru dari santri (${santri?.fullname}).`,
            url: `/app/perizinan-santri/detail?id=${result.id_izin}`,
            receiver: receiver,
            type: 'Perizinan',
          }
        }
        
        helper.sendNotification(req, dataMessage)
      }

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

      const sumberPengajuanAktif =
        validData.sumber_pengajuan || check.sumber_pengajuan;
      const isPegawai = sumberPengajuanAktif === 'Pegawai';

      let file_izin: any = null;
      if (req?.files && req?.files.file_izin) {
        const fileIzin = req?.files?.file_izin;
        const checkFileIzin = helper.checkExtention(fileIzin, 'all');
        if (checkFileIzin != 'allowed')
          return response.failed(checkFileIzin, 422, res);

        const folderDest = isPegawai ? 'perizinan-pegawai' : 'perizinan-santri';
        file_izin = await helper.upload(
          fileIzin,
          folderDest,
          req?.user?.username || 'system',
          'local'
        );
      }

      const finalPayload = helper.only(
        variable.fillable(),
        {
          ...check.toJSON(),
          ...validData,
          ...(file_izin ? { file_izin } : {}),
        },
        true
      );
      await repository.update(
        { ...finalPayload, updated_at: helper.date() },
        { id_izin: id }
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
      const isPegawai = check.sumber_pengajuan === 'Pegawai';

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
        const bulanRomawi = helper.convertToRomawi(moment().month());

        if (isPegawai) {
          // --- LOGIKA UTAMA APPROVAL PEGAWAI ---
          const codeUnit = check.lokasiKerja?.kode_lokasi || 'IZN';
          const nomorSurat = `${String(urut).padStart(3, '0')}/IZN-PEG/${codeUnit}/${bulanRomawi}/${tahun}`;
          const jamKerjaMaster = await JamKerjaPegawaiRepository.detail({
            id_pegawai: check.id_pegawai,
          });
          if (!jamKerjaMaster)
            throw new Error('Jam kerja pegawai tidak ditemukan');

          const existingSurat = await suratIzinRepository.detail({
            id_izin: id,
          });
          if (!existingSurat) {
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
          } else {
            await repository.updateSurat(
              {
                tanggal_cetak: new Date(),
                dicetak_oleh: activeUser,
                status_surat: 'Aktif',
              },
              { id_izin: id },
              trx
            );
          }

          //  Loop & Insert Otomatis ke Absen Harian sesuai rentang tanggal izin
          const start = moment(check.tanggal_mulai);
          const end = moment(check.tanggal_selesai);
          const idJamKerja = jamKerjaMaster?.dataValues?.id_jamkerja || 1;

          while (start.isSameOrBefore(end)) {
            const tanggalTarget = start.format('YYYY-MM-DD');

            // Cari tahu apakah record absen dengan kombinasi 3 kolom ini sudah ada
            const existingAbsen = await AbsenHarianPegawaiRepository.detail({
              id_pegawai: check.id_pegawai,
              tanggal: tanggalTarget,
              id_jamkerja: idJamKerja,
            });

            const dataPayload = {
              id_jamkerja: idJamKerja,
              id_pegawai: check.id_pegawai,
              tanggal: tanggalTarget,
              keterangan_masuk: `Izin: ${check.alasan || 'Disetujui oleh sistem'}`,
              status_kehadiran: check.jenis_izin,
              created_by: activeUser,
            };

            if (!existingAbsen) {
              await AbsenHarianPegawaiRepository.create(
                [
                  {
                    ...dataPayload,
                  },
                ],
                trx
              );
            } else {
              // await AbsenHarianPegawaiRepository.update({ payload: dataPayload,
              //   condition: { id_absen: existingAbsen.id_absen }},
              //   trx
              // );
            }

            start.add(1, 'days');
          }
        } else {
          // --- LOGIKA UTAMA APPROVAL SANTRI ---
          const codeUnit = check.lokasiKamar?.kode_lokasi || 'IZN';
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
      }

      // Send notification
      if (check) {
        const roles = ['administrator']

        if (body.status_approval === 'Disetujui') {
          roles.push('satpam')
        }

        const receiver = await helper.receiverByRole(roles);
        if (check.creator) {
          receiver.push(check.creator.username);
        }

        let dataMessage: any;
        if (isPegawai) {
          const pegawai = await pegawaiRepository.detail({ id_pegawai: check.id_pegawai });
          dataMessage = {
            title: `Perizinan ${body.status_approval}`,
            message: `Terdapat 1 perizinan dari pegawai (${pegawai?.nama_lengkap}) telah ${body.status_approval}.`,
            url: `/app/perizinan-pegawai/detail?id=${check.id_izin}&view=true`,
            receiver: receiver,
            type: 'Perizinan',
          }
        } else {
          const santri = await santriRepository.detail({ id_santri: check.id_santri });
          dataMessage = {
            title: `Perizinan ${body.status_approval}`,
            message: `Terdapat 1 perizinan dari santri (${santri?.fullname}) telah ${body.status_approval}.`,
            url: `/app/perizinan-santri/detail?id=${check.id_izin}&view=true`,
            receiver: receiver,
            type: 'Perizinan',
          }
        }
        
        helper.sendNotification(req, dataMessage)
      }

      await trx?.commit();
      return response.success(
        'Approval perizinan berhasil diproses',
        null,
        res
      );
    } catch (err: any) {
      console.log(err);
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
      const isPegawai = check.sumber_pengajuan === 'Pegawai';

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

      if (isPegawai && check.status_approval === 'Disetujui') {
        await AbsenHarianPegawaiRepository.removeAbsenByRangeDate(
          check.id_pegawai as string,
          check.tanggal_mulai,
          check.tanggal_selesai,
          trx
        );
      }

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
        ? moment(result.tanggal_mulai).format('DD-MMM-YYYY HH:mm')
        : '-';
      const tanggalSelesai = result.tanggal_selesai
        ? moment(result.tanggal_selesai).format('DD-MMM-YYYY HH:mm')
        : '-';

      const isPegawai = result.sumber_pengajuan === 'Pegawai';

      const formattedDetail = {
        status_izin: result.status_approval,
        ...(isPegawai
          ? {
              nama_pegawai: result.pegawai?.nama_lengkap || '-',
              nip: result.pegawai?.nip || '-',
              lokasi_kerja: result.lokasiKerja?.nama_lokasi || '-',
            }
          : {
              nama_santri: result.santri?.fullname || '-',
              nis: result.santri?.nis || '-',
              kamar: result.lokasiKamar?.nama_lokasi || '-',
            }),
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
      const perizinan =
        await repository.findActiveIzinByCardNumber(nomor_kartu_santri);

      if (!perizinan) {
        throw new Error(
          'Akses Ditolak: Santri tidak memiliki dokumen perizinan aktif yang sah untuk hari ini!'
        );
      } 

      const perizinanSantriData = perizinan.santri;
      if (!perizinanSantriData) {
        throw new Error('Struktur data profil santri tidak ditemukan!');
      }

      const todayStr = moment().format('YYYY-MM-DD HH:mm:ss');
      const tglSelesaiStr = moment(perizinan.tanggal_selesai).format(
        'YYYY-MM-DD HH:mm:ss'
      );

      const id_izin = perizinan.id_izin;
      const logGate = await repository.findLogGate(id_izin);
      const activePetugasId =
        req?.user?.resource_id || req?.user?.id || 'GATE_KEEPER_ID';


      if (logGate && logGate.waktu_keluar && logGate.waktu_masuk) {
        const tglMulaiFmt = moment(perizinan.tanggal_mulai).format('DD MMM YYYY');
        const tglSelesaiFmt = moment(perizinan.tanggal_selesai).format('DD MMM YYYY');
        
        const txtKeluarFmt = moment(logGate.waktu_keluar).format('DD/MM/YYYY HH:mm');
        const txtMasukFmt = moment(logGate.waktu_masuk).format('DD/MM/YYYY HH:mm');

        throw new Error(
          `Santri atas nama ${perizinanSantriData.fullname || 'n/a'} tidak memiliki dokumen perizinan aktif lain yang sah untuk hari ini. ` +
          `Dokumen izin terakhir (Masa Berlaku: ${tglMulaiFmt} s/d ${tglSelesaiFmt}) dinyatakan Selesai/Hangus karena riwayat log gate mencatat: ` +
          `Tapping Keluar pada [${txtKeluarFmt}] WIB dan Tapping Kembali pada [${txtMasukFmt}] WIB.`
        );
      }

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

        if (moment(waktuKeluarSekarang).isAfter(moment(perizinan.tanggal_selesai))) {
          const tglSelesaiFmt = moment(perizinan.tanggal_selesai).format('DD/MM/YYYY HH:mm');
          throw new Error(
            `Akses Ditolak: Tidak boleh keluar! Waktu perizinan santri telah habis/kedaluwarsa sejak ${tglSelesaiFmt} WIB.`
          );
        }

        await repository.createLogGate(
          {
            id_gate: uuidv4(),
            id_izin,
            waktu_keluar: waktuKeluarSekarang,
            petugas_keluar: activePetugasId,
            status_gate: 'Keluar',
            keterangan:
              req.body.keterangan ||
              'Santri keluar komplek pondok via tapping kartu.',
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

      // --- SANTRI KEMBALI KE DALAM PONDOK (Log Gate Sudah Ada) ---
      else {
        // Karena tidak menggunakan status_gate, cek ketersediaan waktu_masuk
        if (logGate.waktu_masuk) {
          throw new Error(
            'Akses Ditolak: Santri dengan kartu ini sudah tercatat kembali ke dalam pondok sebelumnya.'
          );
        }

        const waktuMasukSekarang = new Date();

        if (logGate.waktu_keluar) {

          const limitParam = await paramRepository.detail({ 
            param_key: 'LIMIT_SCAN_LOG_GATE_SANTRI' 
          });

          const limitMenit = limitParam?.dataValues?.param_value 
            ? parseInt(limitParam.dataValues.param_value, 10) 
            : 60;

          const waktuKeluar = moment(logGate.waktu_keluar);
          const waktuMasuk = moment(waktuMasukSekarang);
          
          const selisihMenit = waktuMasuk.diff(waktuKeluar, 'minutes');

          if (selisihMenit < limitMenit) {
            const sisaMenit = limitMenit - selisihMenit;
            throw new Error(
              `Akses Ditolak: Scan masuk terlalu cepat. Silakan tunggu ${sisaMenit} menit lagi.`
            );
          }
        }

        // Update log gerbang masuk pondok
        await repository.updateLogGate(
          {
            waktu_masuk: waktuMasukSekarang,
            petugas_masuk: activePetugasId,
            status_gate: 'Kembali',
            keterangan:
              req.body.keterangan ||
              'Santri kembali masuk pondok via tapping kartu.',
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
            waktu_masuk: moment(waktuMasukSekarang).format(
              'YYYY-MM-DD HH:mm:ss'
            ),
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
        is_pegawai,
        id_pegawai,
        id_lokasi,
        id_lembaga
      } = req.body;
      const isTemplate: boolean = template && template == '1';
      const isPegawaiActive: boolean =
        is_pegawai === true || is_pegawai === 'true';

      const result = await repository.listForExport({
        keyword,
        status_approval,
        jenis_izin,
        start_date,
        end_date,
        isTemplate,
        is_pegawai: isPegawaiActive,
        id_pegawai: isPegawaiActive ? id_pegawai : undefined,
        id_lokasi,
        id_lembaga
      });

      const workbook = new ExcelJS.Workbook();
      const sheetName = isPegawaiActive
        ? 'DATA PERIZINAN PEGAWAI'
        : 'DATA PERIZINAN SANTRI';
      let sheet = workbook.addWorksheet(sheetName);

      // Memanggil fungsi helper internal generateDataExcel
      sheet = this.generateDataExcel(
        sheet,
        result,
        isTemplate,
        isPegawaiActive
      );

      const { dir, path } = await helper.checkDirExport('excel');
      const filePrefix = isPegawaiActive
        ? 'perizinan-pegawai'
        : 'perizinan-santri';
      const filename = `${filePrefix}-${isTemplate ? 'template' : moment().format('DDMMYYYY-HHmmss')}.xlsx`;
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
    const activeUser = req?.user?.id || 'SYSTEM';
    const mode: 'preview' | 'commit' = req.body?.mode ?? 'preview';
    const isPegawai: boolean =
      req.body?.is_pegawai === true ||
      req.body?.is_pegawai === 'true' ||
      req.query?.is_pegawai === 'true';
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
          const cleanData = this.normalizeRow(rawRowData, isPegawai);

          const errors = this.validateRow(cleanData, isPegawai);

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
          if (isPegawai) {
            if (cleanData.id_pegawai) {
              try {
                const hasActive = await repository.checkActiveLicensePegawai(
                  cleanData.id_pegawai
                );
                if (hasActive) {
                  errors.push(
                    'Pegawai masih memiliki pengajuan aktif berkriteria Menunggu / Sedang Disetujui saat ini'
                  );
                }
              } catch (dbErr) {
                errors.push(
                  'Gagal memverifikasi status aktif perizinan pegawai'
                );
              }
            }
          } else {
            if (cleanData.id_santri) {
              try {
                const hasActive = await repository.checkActiveLicense(
                  cleanData.id_santri, cleanData.tanggal_mulai, cleanData.tanggal_selesai
                );
                if (hasActive) {
                  errors.push(
                    'Santri masih memiliki izin aktif atau menunggu persetujuan.'
                  );
                }
              } catch (dbErr) {
                errors.push(
                  'Gagal memverifikasi status aktif perizinan santri'
                );
              }
            }
          }

          const payload = {
            id_izin: uuidv4(),
            id_santri: cleanData.id_santri || null,
            id_lokasi_kamar: cleanData.id_lokasi_kamar || null,
            id_pegawai: cleanData.id_pegawai || null,
            id_lokasi_kerja: cleanData.id_lokasi_kerja || null,
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
            status_approval: cleanData.status_approval || 'Menunggu',
            created_by: activeUser,
            kode_unit: cleanData.kode_lokasi || 'IZN',
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
                const bulanRomawi = helper.convertToRomawi(
                  item.tanggal_mulai
                    ? moment(item.tanggal_mulai).month()
                    : moment().month()
                );

                const jenisKodeSurat = item.id_pegawai ? 'IZN-PEG' : 'IZN-SAN';
                const nomorSurat = `${String(urut).padStart(3, '0')}/${jenisKodeSurat}/${codeUnit}/${bulanRomawi}/${tahun}`;
                
                const existingSurat = await suratIzinRepository.detail({ id_izin: item.id_izin }, trx);

                if (!existingSurat) {
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

                // ========================================================
                // LOGIKA KONDISIONAL: HANYA JALANKAN ABSENSI JIKA PEGAWAI
                // ========================================================
                if (item.id_pegawai) {
                  const jamKerjaMaster = await JamKerjaPegawaiRepository.detail({ id_pegawai: item.id_pegawai }); 
                  if (!jamKerjaMaster) throw new Error(`Jam kerja untuk pegawai dengan ID ${item.id_pegawai} tidak ditemukan`);
                  
                  const start = moment(item.tanggal_mulai);
                  const end = moment(item.tanggal_selesai);
                  const idJamKerja = jamKerjaMaster?.dataValues?.id_jamkerja || 1;

                  while (start.isSameOrBefore(end)) {
                    const tanggalTarget = start.format('YYYY-MM-DD');

                    // Cari tahu apakah record absen dengan kombinasi 3 kolom ini sudah ada (Sertakan trx)
                    const existingAbsen = await AbsenHarianPegawaiRepository.detail({
                        id_pegawai: item.id_pegawai,
                        tanggal: tanggalTarget,
                        id_jamkerja: idJamKerja
                      },
                      trx
                    );

                    const dataPayload = {
                      id_jamkerja: idJamKerja,
                      id_pegawai: item.id_pegawai,
                      tanggal: tanggalTarget,
                      keterangan_masuk: `Izin: ${item.alasan || 'Disetujui oleh sistem'}`,
                      status_kehadiran: item.jenis_izin, 
                      created_by: activeUser,
                    };

                    if (!existingAbsen) {
                      await AbsenHarianPegawaiRepository.create([{
                        id_absen: `ABS-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now()}`,
                        ...dataPayload
                      }], trx);
                    } else {
                      // Opsional: Lakukan update status jika data absen hari itu sudah ada
                      await AbsenHarianPegawaiRepository.update({payload: dataPayload, condition: {
                        id_pegawai: item.id_pegawai,
                        tanggal: tanggalTarget,
                        id_jamkerja: idJamKerja
                      }}, trx);
                    }

                    start.add(1, 'days');
                  }
                } else {
                  // Tempatkan logika sinkronisasi log absensi / mutasi santri di sini jika dibutuhkan di kemudian hari
                  console.log(`Perizinan Santri dengan ID ${item.id_santri} berhasil diproses tanpa absensi pegawai.`);
                }
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
      const activeUser = req?.user?.id || 'SYSTEM';

      // Iterasi untuk memproses Surat Izin (Tambah atau Cabut) secara kondisional
      for (const item of payloads) {
        const reqIzin = await repository.create(item, trx);

        // --- Tambah Surat Izin jika status_approval langsung 'Disetujui' ---
        if (item.status_approval === 'Disetujui' && !item.is_canceled) {
          const tahun = item.tanggal_mulai
            ? moment(item.tanggal_mulai).year()
            : moment().year();
          const urut = await repository.getNextUrutSurat(tahun);

          const codeUnit = item.kode_unit || 'IZN';
          const bulanRomawi = helper.convertToRomawi(
            item.tanggal_mulai
              ? moment(item.tanggal_mulai).month()
              : moment().month()
          );

          // Penentuan jenis kode surat berdasarkan entitas pengaju (Pegawai vs Santri)
          const jenisKodeSurat = item.id_pegawai || item.sumber_pengajuan === 'Pegawai' ? 'IZN-PEG' : 'IZN-SAN';
          const nomorSurat = `${String(urut).padStart(3, '0')}/${jenisKodeSurat}/${codeUnit}/${bulanRomawi}/${tahun}`;

          // Masukkan objek transaksi trx agar pembacaan konsisten
          const existingSurat = await suratIzinRepository.detail({ id_izin: item.id_izin }, trx);
          if (!existingSurat) {
            await repository.createSurat(
              {
                id_izin: reqIzin.id_izin,
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

          // ========================================================
          // LOGIKA KONDISIONAL: HANYA PROSES ABSENSI JIKA PEGAWAI
          // ========================================================
          if (item.id_pegawai) {
            const jamKerjaMaster = await JamKerjaPegawaiRepository.detail({ id_pegawai: item.id_pegawai });
            if (!jamKerjaMaster) throw new Error(`Jam kerja pegawai untuk ID ${item.id_pegawai} tidak ditemukan`);

            const start = moment(item.tanggal_mulai);
            const end = moment(item.tanggal_selesai);
            const idJamKerja = jamKerjaMaster?.dataValues?.id_jamkerja || 1;

            while (start.isSameOrBefore(end)) {
              const tanggalTarget = start.format('YYYY-MM-DD');

              // Perbaikan utama visibilitas transaksi berjalan
              const existingAbsen = await AbsenHarianPegawaiRepository.detail({
                id_pegawai: item.id_pegawai,
                tanggal: tanggalTarget,
                id_jamkerja: idJamKerja
              },
                trx
              );

              const dataPayload = {
                id_jamkerja: idJamKerja,
                id_pegawai: item.id_pegawai,
                tanggal: tanggalTarget,
                keterangan_masuk: `Izin: ${item.alasan || 'Disetujui oleh sistem'}`,
                status_kehadiran: item.jenis_izin,
                created_by: activeUser,
              };

              if (!existingAbsen) {
                await AbsenHarianPegawaiRepository.create([{
                  id_absen: `ABS-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now()}`,
                  ...dataPayload
                }], trx);
              } else {
                // Opsional: Jika record absen sudah ada, Anda bisa melakukan update status di sini jika diperlukan
              }

              start.add(1, 'days');
            }
          } else {
            // Logika untuk Santri, abaikan pencarian jam kerja & absen harian pegawai.
            // Anda bisa menaruh repositori absensi khusus santri di sini jika ada di masa mendatang.
            console.log(`Perizinan Santri (${item.id_santri}) berhasil diproses tanpa absensi pegawai.`);
          }
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

  public insertMassalSantri = async (req: Request, res: Response) => {
    const { id_cabang, jenis_izin, tanggal_mulai, tanggal_selesai, alasan } = req.body;

    // Validasi input form utama di awal (Synchronous) sebelum masuk background
    if (!id_cabang || !jenis_izin || !tanggal_mulai || !tanggal_selesai) {
      return response.success('Form tidak lengkap. Cabang, jenis izin, dan tanggal wajib diisi.', null, res, false);
    }

    const activeUser = req?.user?.id || 'SYSTEM';
    const idApprover = req?.user?.id || null;

    // Kirim response sukses instan ke pengguna (UI bebas dari loading/timeout)
    response.success(
      'Proses perizinan massal telah dimasukkan ke dalam antrean background sistem.',
      { status: 'Processing' },
      res
    );

    setImmediate(async () => {
      const trx = await PerizinanSantri.sequelize?.transaction();

      const summaryLog = {
        timestamp: new Date().toISOString(),
        id_cabang,
        jenis_izin,
        tanggal_mulai,
        tanggal_selesai,
        total_santri_ditemukan: 0,
        total_sukses: 0,
        total_gagal: 0,
        detail_gagal: [] as Array<{ id_santri: string; nama_santri: string; alasan_gagal: string }>,
        status_final: 'SUCCESS'
      };

      try {
        console.log(`[Background Job] Memulai pemrosesan massal untuk Cabang ID: ${id_cabang}`);

        const listSantri = await repository.findSantriByCabangMassal(id_cabang, trx);

        if (!listSantri || listSantri.length === 0) {
          await trx?.rollback();
          summaryLog.status_final = 'CANCELLED (No active santri found)';
          console.warn(`[Background Job Cancelled] Tidak ada santri aktif di cabang ${id_cabang}`);
          return;
        }

        summaryLog.total_santri_ditemukan = listSantri.length;

        const tahun = moment(tanggal_mulai).year();
        let urutTerakhir = await repository.getNextUrutSurat(tahun);

        for (const santri of listSantri) {
          try {
            const kamarAktif = santri?.penempatanKamar && santri?.penempatanKamar.length > 0
              ? santri.penempatanKamar[0]
              : null;

            const idLokasiKamar = kamarAktif?.id_lokasi || null;
            const codeUnit = kamarAktif?.lokasi?.kode_lokasi || 'IZN';

            // INSERT ke tabel parent (perizinan_santri)
            const [perizinan] = await repository.createPerizinanMassal([{
              id_santri: santri.id_santri,
              id_lokasi_kamar: idLokasiKamar,
              id_pegawai: null,
              id_lokasi_kerja: null,
              sumber_pengajuan: 'Waliasuh',
              jenis_izin: jenis_izin,
              kondisi: 'Normal',
              tanggal_pengajuan: new Date(),
              tanggal_mulai: moment(tanggal_mulai).format('YYYY-MM-DD'),
              tanggal_selesai: moment(tanggal_selesai).format('YYYY-MM-DD'),
              alasan: alasan || 'Perizinan Massal Cabang',
              status_approval: 'Disetujui',
              id_approver: idApprover,
              tanggal_approval: new Date(),
              catatan_approval: 'Disetujui otomatis oleh sistem (Massal)',
              created_by: activeUser,
              kode_unit: codeUnit,
            }], trx);

            const realIdIzin = perizinan.id_izin;

            // INSERT ke tabel surat_perizinan_santri
            const bulanRomawi = helper.convertToRomawi(moment(tanggal_mulai).month() + 1);
            const nomorSurat = `${String(urutTerakhir).padStart(3, '0')}/IZN-SAN/${codeUnit}/${bulanRomawi}/${tahun}`;

            await repository.createSuratMassal([{
              id_izin: realIdIzin,
              urut: urutTerakhir,
              tahun: tahun,
              kode_unit: codeUnit,
              nomor_surat: nomorSurat,
              qrcode_token: `QR-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now()}`,
              tanggal_cetak: new Date(),
              dicetak_oleh: activeUser,
              versi_surat: 1,
              status_surat: 'Aktif',
            }], trx);

            // INSERT ke tabel log_gate_santri
            await repository.createLogMassal([{
              id_log: uuidv4(),
              id_izin: realIdIzin,
              waktu_keluar: new Date(tanggal_mulai),
              petugas_keluar: activeUser,
              status_gate: 'Keluar',
              keterangan: `Keluar massal cabang: ${alasan || 'Izin Bersama'}`,
            }], trx);

            urutTerakhir++;
            summaryLog.total_sukses++;

          } catch (santriError: any) {
            summaryLog.total_gagal++;
            summaryLog.detail_gagal.push({
              id_santri: santri.id_santri,
              nama_santri: santri.fullname || 'N/A',
              alasan_gagal: santriError.message
            });

            throw santriError; // Triggers loop breakdown and runs catch block
          }
        }

        await trx?.commit();

      } catch (err: any) {
        await trx?.rollback();
        summaryLog.status_final = `FAILED (Rollbacked: ${err.message})`;
      } finally {
        // --- PENYIMPANAN LOG KE FILE .TXT ---
        try {
          const dateStr = moment().format('YYYYMMDD');
          const timeStr = moment().format('HHmmss');
          const fileName = `perizinan-santri-massal-${dateStr}-${timeStr}.txt`;
          const logDirectory = path.join(process.cwd(), 'logs');

          if (!FileSystem.existsSync(logDirectory)) {
            FileSystem.mkdirSync(logDirectory, { recursive: true });
          }

          // Generate konten teks berformat report manual
          let txtContent = `============================================================\n`;
          txtContent += `      LAPORAN BG-JOB: PERIZINAN MASSAL SANTRI CABANG        \n`;
          txtContent += `============================================================\n`;
          txtContent += `Waktu Eksekusi : ${moment(summaryLog.timestamp).format('DD MMMM YYYY, HH:mm:ss')} WIB\n`;
          txtContent += `ID Cabang      : ${summaryLog.id_cabang}\n`;
          txtContent += `Jenis Izin     : ${summaryLog.jenis_izin}\n`;
          txtContent += `Periode Izin   : ${summaryLog.tanggal_mulai} s/d ${summaryLog.tanggal_selesai}\n`;
          txtContent += `Status Akhir   : ${summaryLog.status_final}\n`;
          txtContent += `------------------------------------------------------------\n`;
          txtContent += `RINGKASAN DATA:\n`;
          txtContent += `  - Total Santri Ditemukan : ${summaryLog.total_santri_ditemukan}\n`;
          txtContent += `  - Berhasil Diproses     : ${summaryLog.total_sukses}\n`;
          txtContent += `  - Gagal Diproses        : ${summaryLog.total_gagal}\n`;
          txtContent += `============================================================\n\n`;

          if (summaryLog.detail_gagal.length > 0) {
            txtContent += `DAFTAR SANTRI GAGAL DIPROSES:\n`;
            txtContent += `------------------------------------------------------------\n`;
            summaryLog.detail_gagal.forEach((item, index) => {
              txtContent += `${index + 1}. ID Santri    : ${item.id_santri}\n`;
              txtContent += `   Nama Santri  : ${item.nama_santri}\n`;
              txtContent += `   Alasan Gagal : ${item.alasan_gagal}\n`;
              txtContent += `------------------------------------------------------------\n`;
            });
          } else {
            txtContent += `Hasil Pemrosesan Bersih. Tidak ada santri yang gagal.\n`;
          }

          txtContent += `\n-- Akhir Dokumen Log --\n`;

          const filePath = path.join(logDirectory, fileName);
          FileSystem.writeFileSync(filePath, txtContent, 'utf-8');
          console.log(`[Log Saved] Berkas teks laporan sukses ditulis di: ${filePath}`);

        } catch (fileError: any) {
          console.error(`[Log Save Error] Gagal menulis file teks .txt: ${fileError.message}`);
        }
      }
    });
  };
}

export const PerizinanSantriController = new Controller();
