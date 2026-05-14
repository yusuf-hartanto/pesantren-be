import { z } from 'zod';

export const bobotSchema = z.object({
  id_penilaian: z.string().min(1, 'Jenis penilaian wajib diisi'),
  lembaga_type: z.enum(['FORMAL', 'PESANTREN']),
  id_lembaga: z.string().min(1, 'Lembaga wajib diisi'),
  id_tingkat: z.string().nullable().optional(),
  id_tahunajaran: z.string().min(1, 'Tahun ajaran wajib diisi'),
  bobot: z.number().min(0).max(100),
  status: z.enum(['Aktif', 'Nonaktif']).default('Aktif'),
});
