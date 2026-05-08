import { z } from 'zod';

export const masterSlotWaktuSchema = z.object({
  kode_slot: z.string().nonempty('Kode Slot wajib diisi'),
  jam_mulai: z.string().nonempty('Jam Mulai wajib diisi'),
  jam_selesai: z.string().nonempty('Jam Selesai wajib diisi'),
  is_active: z.boolean().optional(),
  keterangan: z.any(),
});
