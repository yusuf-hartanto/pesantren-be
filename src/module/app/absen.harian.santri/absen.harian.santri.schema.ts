'use strict';

import { z } from 'zod';

export const absenHarianSantriSchema = z.object({
  id_santri: z
    .string()
    .min(1, { message: 'ID Santri tidak boleh kosong' })
    .uuid({ message: 'Format ID Santri harus berupa UUID' }),
    
  id_lokasi_kamar: z
    .string()
    .min(1, { message: 'ID Lokasi Kamar tidak boleh kosong' })
    .uuid({ message: 'Format ID Lokasi Kamar harus berupa UUID' }),

  id_shift_presensi: z
    .string()
    .uuid({ message: 'Format ID Kamar harus berupa UUID' }),
    
  tanggal: z
    .string()
    .optional()
    .transform((val) => (val ? val : undefined)),
    
  waktu_absen: z
    .string()
    .optional()
    .transform((val) => (val ? val : undefined)),
    
  status_kehadiran: z.enum(['Hadir', 'Izin', 'Sakit', 'Alfa']).default('Hadir'),
  keterangan: z.string().nullable().optional(),
});

// Schema untuk memproses presensi kolektif dari form kamar/asrama
export const bulkAbsenHarianSantriSchema = z.object({
  tanggal: z
    .string()
    .min(1, { message: 'Tanggal absensi tidak boleh kosong' }),
    
  id_lokasi_kamar: z
    .string()
    .min(1, { message: 'ID Kamar tidak boleh kosong' })
    .uuid({ message: 'Format ID Kamar harus berupa UUID' }),

  id_shift_presensi: z
    .string()
    .uuid({ message: 'Format ID Kamar harus berupa UUID' }),
    
  waktu_absen: z.string().optional(),
  
  data_absen: z.array(
    z.object({
      id_santri: z
        .string()
        .min(1, { message: 'ID Santri tidak boleh kosong' })
        .uuid({ message: 'Format ID Santri harus berupa UUID' }),
      status_kehadiran: z.enum(['Hadir', 'Izin', 'Sakit', 'Alfa']),
      keterangan: z.string().nullable().optional(),
    })
  ).min(1, 'Data presensi santri tidak boleh kosong'),
});

export const scanQrAbsenSchema = z.object({
  nis: z.string()
    .min(1, { message: 'NIS santri wajib dikirimkan' }).trim().min(1),
  waktu_custom: z.string().optional(), 
  tanggal_custom: z.string().optional(),
  id_shift_presensi: z.string().optional(),
  id_lokasi: z.string().optional()
})