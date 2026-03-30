import { z } from 'zod';

export const jenisPenilaianSchema = z.object({
  singkatan: z.string().max(10, "Singkatan maksimal 10 karakter").optional().nullable(),
  jenis_pengujian: z.string().min(1, "Jenis pengujian wajib diisi"),
  lembaga_type: z.enum(['FORMAL', 'PESANTREN']),
  is_ujian: z.number().int().min(0).max(1, "is_ujian hanya boleh 0 atau 1"),
  status: z.enum(['active', 'inactive']).default('active'),
  keterangan: z.string().optional().nullable(),
});