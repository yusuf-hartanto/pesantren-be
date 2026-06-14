'use strict';

import { z } from 'zod';

export const logGateSantriSchema = z.object({
  id_izin: z
    .string()
    .min(1, { message: 'ID Izin tidak boleh kosong' })
    .uuid({ message: 'Format ID Izin harus berupa UUID' }),

  waktu_keluar: z.string().min(1, { message: 'Waktu keluar wajib diisi' }),

  petugas_keluar: z
    .string()
    .min(1, { message: 'Nama petugas keluar tidak boleh kosong' }),

  waktu_masuk: z.string().nullable().optional(),

  petugas_masuk: z.string().nullable().optional(),

  status_gate: z.enum(['Keluar', 'Kembali']),

  keterangan: z.string().nullable().optional(),
});
