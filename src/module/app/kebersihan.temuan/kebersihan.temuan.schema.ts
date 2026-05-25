import { z } from 'zod';

export const kebersihanTemuanSchema = z.object({
  id_inspeksi: z.any(),
  kategori: z.string().nonempty('Kategori wajib diisi'),
  deskripsi: z.any(),
  tingkat: z
    .number('Tingkat wajib diisi')
    .min(1, 'Tingkat wajib diisi (1-3)')
    .max(3, 'Tingkat wajib diisi (1-3)'),
  perlu_tindak_lanjut: z.boolean().optional(),
  foto_path: z.any(),
  foto_path_tindakan: z.any(),
  status: z.number(),
});
