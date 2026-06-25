'use strict';

import { z } from 'zod';

export const pengajuanIzinSchema = z
  .object({
    id_santri: z
      .string()
      .uuid({ message: 'Format ID Santri harus berupa UUID' })
      .nullable()
      .optional(),

    id_lokasi_kamar: z
      .string()
      .uuid({ message: 'Format ID Lokasi Kamar harus berupa UUID' })
      .nullable()
      .optional(),

    id_pegawai: z
      .string()
      .uuid({ message: 'Format ID Pegawai harus berupa UUID' })
      .nullable()
      .optional(),

    id_lokasi_kerja: z
      .string()
      .uuid({ message: 'Format ID Lokasi Kerja harus berupa UUID' })
      .nullable()
      .optional(),

    sumber_pengajuan: z.enum(['Waliasuh', 'Orang Tua', 'Kesehatan', 'Pegawai']), 

    jenis_izin: z.enum(['Izin', 'Sakit']),

    tanggal_mulai: z.string().min(1, { message: 'Tanggal mulai wajib diisi' }),

    tanggal_selesai: z
      .string()
      .min(1, { message: 'Tanggal selesai wajib diisi' }),

    alasan: z.string().min(1, { message: 'Alasan tidak boleh kosong' }),
  })
  .refine(
    (data) => {
      if (data.sumber_pengajuan === 'Pegawai') {
        return !!data.id_pegawai && !!data.id_lokasi_kerja;
      } else {
        return !!data.id_santri && !!data.id_lokasi_kamar;
      }
    },
    {
      message: 'Data subjek perizinan (Santri/Pegawai) beserta lokasinya wajib diisi sesuai dengan sumber pengajuan',
      path: ['sumber_pengajuan'], 
    }
  );

export const approvalIzinSchema = z.object({
  status_approval: z.enum(['Disetujui', 'Ditolak']),

  catatan_approval: z.string().nullable().optional(),
});