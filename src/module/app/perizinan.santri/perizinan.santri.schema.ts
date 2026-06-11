'use strict';

import { z } from 'zod';

export const pengajuanIzinSchema = z
  .object({
    id_santri: z
      .string()
      .min(1, { message: 'ID Santri tidak boleh kosong' })
      .uuid({ message: 'Format ID Santri harus berupa UUID' }),

    id_lokasi_kamar: z
      .string()
      .min(1, { message: 'ID Lokasi Kamar tidak boleh kosong' })
      .uuid({ message: 'Format ID Lokasi Kamar harus berupa UUID' }),

    sumber_pengajuan: z.enum([
      'Waliasuh',
      'Orang Tua',
      'Kesehatan',
    ]),

    jenis_izin: z.enum([
      'Izin',
      'Sakit',
    ]),

    // kondisi: z
    //   .string()
    //   .min(1, { message: 'Kondisi tidak boleh kosong' }),

    tanggal_mulai: z
      .string()
      .min(1, { message: 'Tanggal mulai wajib diisi' }),

    tanggal_selesai: z
      .string()
      .min(1, { message: 'Tanggal selesai wajib diisi' }),

    alasan: z
      .string()
      .min(1, { message: 'Alasan tidak boleh kosong' }),
  });

export const approvalIzinSchema = z.object({
  status_approval: z.enum([
    'Disetujui',
    'Ditolak',
  ]),

  catatan_approval: z
    .string()
    .nullable()
    .optional(),
});