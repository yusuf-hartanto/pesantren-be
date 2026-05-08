import { z } from 'zod';
import { kebersihanTemuanSchema } from '../kebersihan.temuan/kebersihan.temuan.schema';

export const status = ['BERSIH', 'KOTOR']
export const kodeSlot = ['PAGI', 'SIANG', 'SORE', 'MALAM']
export const kebersihanInspeksiSchema = z.object({
  id_cabang: z.any(),
  id_lokasi: z.any(),
  id_petugas: z.any(),
  id_jadwal: z.any(),
  tanggal: z.string().nonempty('Tanggal wajib diisi'),
  waktu: z.string().nonempty('Waktu wajib diisi'),
  kode_slot: z.enum(kodeSlot, `Kode Slot wajib ${kodeSlot.join('/')}`),
  catatan_umum: z.any(),
  status_kondisi: z.enum(status, `Status Kondisi wajib ${status.join('/')}`),
  temuans: z.array(kebersihanTemuanSchema)
});
