import { z } from 'zod';

export const status = ['Aktif', 'Nonaktif', 'Arsip']
export const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']
export const jadwalPelajaranSchema = z.object({
  id_kelas: z.any(),
  id_kelas_mda: z.any(),
  id_gmapel: z.any(),
  id_tahunajaran: z.any(),
  id_jam_pelajaran: z.any(),
  id_semester: z.any(),
  id_lokasi: z.any(),
  keterangan: z.any(),
  hari: z.enum(hari, `Hari wajib ${hari.join('/')}`),
  status: z.enum(status, `Status wajib ${status.join('/')}`),
});
