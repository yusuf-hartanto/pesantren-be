import { z } from 'zod';

export const lembagaSchema = z.object({
  nama_lembaga: z
    .string()
    .min(3, 'Nama lembaga minimal 3 karakter')
    .max(150, 'Nama lembaga maksimal 150 karakter'),
  id_cabang: z
    .string()
    .min(1, 'ID Cabang wajib diisi'), // Menangani required_error di sini
    // .uuid('Format ID Cabang tidak valid'),
  keterangan: z.string().optional().nullable(),
});


export const lembagaUpdateSchema = lembagaSchema.partial();