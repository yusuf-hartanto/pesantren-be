import { z } from 'zod';

export const pendidikan = [
  'Tidak Sekolah',
  'SD / MI',
  'SMP / MTs',
  'SMA / MA',
  'SMK',
  'D1',
  'D2',
  'D3',
  'S1',
  'S2',
  'S3',
  'Lainnya',
];

export const pekerjaan = [
  'Tidak Bekerja',
  'Ibu Rumah Tangga',
  'Petani',
  'Buruh Harian',
  'Nelayan',
  'Wiraswasta',
  'Pedagang',
  'Karyawan Swasta',
  'PNS',
  'TNI / POLRI',
  'Guru / Dosen',
  'Pekerja Migran',
  'Pensiunan',
  'Lainnya',
];

export const penghasilan = [
  '< 1 juta',
  '1–2 juta',
  '2–3 juta',
  '3–5 juta',
  '> 5 juta',
  'Tidak berpenghasilan',
];

export const orangTuaWaliSchema = z.object({
  nama_wali: z.string().nonempty('Nama Wali wajib diisi'),
  hubungan: z.string().nonempty('Hubungan wajib diisi'),
  nik: z.string(),
  pendidikan: z.enum(pendidikan, `Pendidikan wajib ${pendidikan.join('/')}`),
  pekerjaan: z.enum(pekerjaan, `Pekerjaan wajib ${pekerjaan.join('/')}`),
  penghasilan: z.enum(
    penghasilan,
    `Penghasilan wajib ${penghasilan.join('/')}`
  ),
  no_hp: z.string().nonempty('No HP wajib diisi'),
  alamat: z.string().nonempty('Alamat wajib diisi'),
  province_id: z.any(),
  city_id: z.any(),
  district_id: z.any(),
  sub_district_id: z.any(),
  keterangan: z.any(),
  id_santri: z.any(),
});
