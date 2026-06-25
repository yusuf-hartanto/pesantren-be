'use strict';

import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

export const jamKerjaPegawaiSchema = z.object({
  id_pegawai: z
    .string({ message: 'ID Pegawai harus berupa teks' })
    .min(1, 'ID Pegawai wajib diisi'),

  id_lokasi: z
    .string({ message: 'ID Lokasi Kerja harus berupa teks' })
    .min(1, 'ID Lokasi Kerja wajib diisi'),

  waktu_mulai: z
    .string({ message: 'Waktu mulai harus berupa teks' })
    .min(1, 'Waktu mulai wajib diisi')
    .regex(timeRegex, 'Format waktu mulai harus valid (HH:mm:ss atau HH:mm)'),

  waktu_selesai: z
    .string({ message: 'Waktu selesai harus berupa teks' })
    .min(1, 'Waktu selesai wajib diisi')
    .regex(timeRegex, 'Format waktu selesai harus valid (HH:mm:ss atau HH:mm)'),

  keterangan: z
    .string({ message: 'Keterangan harus berupa teks' })
    .optional()
    .nullable()
    .default('-')
    .transform((val) => (!val || val.trim() === '' ? '-' : val.trim())),

  // Untuk boolean, jika tidak dikirim akan otomatis masuk ke .default(true)
  is_active: z.any().transform((val) => {
    if (typeof val === 'boolean') return val;
    if (val === '1' || val === 1) return true;
    if (val === '0' || val === 0) return false;
    return true; // fallback default
  }),
});

export type IJamKerjaPegawaiInput = z.infer<typeof jamKerjaPegawaiSchema>;
