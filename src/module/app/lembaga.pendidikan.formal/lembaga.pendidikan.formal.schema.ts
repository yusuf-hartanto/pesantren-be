import { z } from 'zod';

const JENIS_OPTIONS = [
  'SD', 'MI', 'SMP', 'MTs', 'SMA', 'MA', 'SMK', 'Diniyah', 'Perguruan Tinggi'
] as const;

const AKREDITASI_OPTIONS = ['A', 'B', 'C', 'Belum Terakreditasi'] as const;

export const lembagaFormalSchema = z.object({
  nama_lembaga: z
    .string()
    .min(1, 'Nama lembaga wajib diisi') // Perbaikan typo
    .min(3, 'Nama lembaga minimal 3 karakter')
    .max(255, 'Nama lembaga terlalu panjang'),
  
  id_cabang: z
    .string()
    .min(1, 'Cabang wajib dipilih') // Perbaikan pesan error
    .nullable()
    .optional(),
  
  keterangan: z
    .string()
    .max(255, 'Keterangan maksimal 255 karakter')
    .nullable()
    .optional(),
  
  // Tips: Gunakan error map agar pesan error enum lebih eksplisit
  jenis_lembaga: z.enum(JENIS_OPTIONS).describe("Jenis lembaga tidak valid"),
  
  status_akreditasi: z.enum(AKREDITASI_OPTIONS).describe('Status akreditasi tidak valid').nullable().optional(),
  
  nomor_npsn: z
    .string()
    .max(20, 'NPSN maksimal 20 karakter')
    .regex(/^[0-9]*$/, 'NPSN hanya boleh berisi angka') // Menggunakan * agar field kosong tidak error
    .nullable()
    .optional(),
});