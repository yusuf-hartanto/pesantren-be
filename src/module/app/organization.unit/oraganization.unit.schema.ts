import { z } from 'zod';

export const orgUnitSchema = z.object({
  nama_orgunit: z
    .string()
    .min(3, 'Nama unit minimal 3 karakter')
    .max(150, 'Nama unit maksimal 150 karakter')
    .transform((val) => val.trim()),
  parent_id: z.string().uuid().nullable().optional(),
  id_cabang: z.string().uuid().nullable().optional(), // Null = Unit Pusat
  id_lembaga: z.string().uuid().nullable().optional(),
  jenis_orgunit: z.enum(['Biro', 'Bagian', 'Lembaga', 'Sub-Unit', 'Umum']),
  lembaga_type: z.enum(['FORMAL', 'PESANTREN']).nullable().optional(),
  keterangan: z.string().max(255).nullable().optional(),
}).superRefine((data, ctx) => {
  // Aturan: Jika jenis_orgunit = "Lembaga" maka "lembaga_type" dan "id_lembaga" wajib
  if (data.jenis_orgunit === 'Lembaga') {
    if (!data.id_lembaga) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ID Lembaga wajib diisi untuk jenis unit 'Lembaga'",
        path: ['id_lembaga'],
      });
    }
    if (!data.lembaga_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tipe Lembaga (FORMAL/PESANTREN) wajib dipilih",
        path: ['lembaga_type'],
      });
    }
  }
});