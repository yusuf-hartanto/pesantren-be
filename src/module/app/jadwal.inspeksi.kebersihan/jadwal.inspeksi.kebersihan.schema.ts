import { z } from 'zod';

export const jadwalInspeksiKebersihanSchema = z.object({
  id_cabang: z.any(),
  id_petugas: z.any(),
  kode_slot: z.any(),
  hari: z.number('Hari harus angka').min(1, 'Hari wajib diisi'),
  is_active: z.boolean().optional(),
  keterangan: z.any()
});
