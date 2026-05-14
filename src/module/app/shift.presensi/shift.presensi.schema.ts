import { z } from 'zod';

export const status = ['Aktif', 'Nonaktif'];
export const kategori = ['ASRAMA', 'PEGAWAI', 'SHOLAT', 'UMUM'];
export const shiftPresensiSchema = z.object({
  kode_shift: z.string().nonempty('Kode Shift wajib diisi'),
  nama_shift: z.string().nonempty('Nama Shift wajib diisi'),
  kategori_shift: z.enum(
    kategori,
    `Kategori Shift wajib ${kategori.join('/')}`
  ),
  waktu_mulai: z.string().nonempty('Waktu Mulai wajib diisi'),
  waktu_selesai: z.string().nonempty('Waktu Selesai wajib diisi'),
  toleransi_menit: z
    .number()
    .min(0, 'Toleransi Menit wajib diisi')
    .max(100, 'Toleransi Menit wajib diisi'),
  is_wajib: z.boolean().optional(),
  keterangan: z.any(),
  status: z.enum(status, `Status wajib ${status.join('/')}`),
});
