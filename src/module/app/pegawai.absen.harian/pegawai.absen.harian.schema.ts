'use strict';

import { z } from 'zod';

// Menggunakan standard format ISO Datetime atau Date string untuk presensi
const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)?$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const absenHarianPegawaiSchema = z.object({
  id_jamkerja: z
    .string({ message: 'ID Jam Kerja harus berupa teks' })
    .min(1, 'ID Jam Kerja wajib diisi'),

  id_pegawai: z
    .string({ message: 'ID Pegawai harus berupa teks' })
    .min(1, 'ID Pegawai wajib diisi'),

  tanggal: z
    .string({ message: 'Tanggal harus berupa teks' })
    .min(1, 'Tanggal wajib diisi')
    .regex(dateRegex, 'Format tanggal harus valid (YYYY-MM-DD)'),

  waktu_masuk: z
    .string({ message: 'Waktu masuk harus berupa teks' })
    .regex(isoDateTimeRegex, 'Format waktu masuk harus valid (ISO Datetime string)')
    .optional()
    .nullable(),

  waktu_keluar: z
    .string({ message: 'Waktu keluar harus berupa teks' })
    .regex(isoDateTimeRegex, 'Format waktu keluar harus valid (ISO Datetime string)')
    .optional()
    .nullable(),

  keterangan_masuk: z
    .string({ message: 'Keterangan masuk harus berupa teks' })
    .optional()
    .nullable()
    .default('-')
    .transform((val) => (!val || val.trim() === '' ? '-' : val.trim())),

  keterangan_keluar: z
    .string({ message: 'Keterangan keluar harus berupa teks' })
    .optional()
    .nullable()
    .default('-')
    .transform((val) => (!val || val.trim() === '' ? '-' : val.trim())),

  lat_masuk: z
    .any()
    .optional()
    .nullable()
    .transform((val) => (val !== undefined && val !== null ? parseFloat(val) : null)),

  long_masuk: z
    .any()
    .optional()
    .nullable()
    .transform((val) => (val !== undefined && val !== null ? parseFloat(val) : null)),

  lat_keluar: z
    .any()
    .optional()
    .nullable()
    .transform((val) => (val !== undefined && val !== null ? parseFloat(val) : null)),

  long_keluar: z
    .any()
    .optional()
    .nullable()
    .transform((val) => (val !== undefined && val !== null ? parseFloat(val) : null)),

  status_kehadiran: z
    .enum(['Hadir', 'Izin', 'Sakit', 'Alfa'])
    .default('Hadir'),
});

// Skema tambahan khusus untuk request body payload API Clock In / Clock Out dari mobile device
export const clockInSchema = z.object({
  id_pegawai: z
    .string({ message: 'ID Pegawai harus berupa teks' })
    .min(1, 'ID Pegawai wajib diisi'),
    
  latitude: z
    .any()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= -90 && val <= 90, {
      message: 'Koordinat Latitude tidak valid (harus di antara -90 dan 90)',
    }),

  longitude: z
    .any()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= -180 && val <= 180, {
      message: 'Koordinat Longitude tidak valid (harus di antara -180 dan 180)',
    }),

  catatan: z
    .string({ message: 'Catatan harus berupa teks' })
    .optional()
    .nullable()
    .default('-')
    .transform((val) => (!val || val.trim() === '' ? '-' : val.trim())),
});

export const clockOutSchema = clockInSchema;

export type IAbsenHarianPegawaiInput = z.infer<typeof absenHarianPegawaiSchema>;
export type IClockInInput = z.infer<typeof clockInSchema>;