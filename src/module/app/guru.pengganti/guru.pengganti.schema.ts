import { z } from 'zod';

export const status = ['Menunggu', 'Disetujui', 'Ditolak'];
export const guruPenggantiSchema = z.object({
  id_jadwal: z.any(),
  id_guru_asli: z.any(),
  id_guru_pengganti: z.any(),
  tanggal: z.string().nonempty('Tanggal wajib diisi'),
  alasan: z.any(),
  status_approval: z.enum(status, `Status wajib ${status.join('/')}`),
});
