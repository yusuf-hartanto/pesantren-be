import { z } from 'zod';

export const pegawaiSchema = z.object({
  nik: z.string().min(16, 'NIK harus 16 digit').max(16, 'NIK harus 16 digit'),
  nip: z.string().optional().nullable(),
  nama_lengkap: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Format email tidak valid').optional().nullable(),
  no_hp: z.string().optional().nullable(),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']),
  tempat_lahir: z.string().optional().nullable(),
  tanggal_lahir: z.string().optional().nullable(), // Format YYYY-MM-DD
  alamat: z.string().optional().nullable(),

  // Wilayah (String UUID/ID dari Master Data Wilayah)
  province_id: z.string().optional().nullable(),
  city_id: z.string().optional().nullable(),
  district_id: z.string().optional().nullable(),
  sub_district_id: z.string().optional().nullable(),

  // Penempatan
  id_orgunit: z.string().uuid('Unit Organisasi wajib dipilih'),
  id_jabatan: z.string().uuid('Jabatan wajib dipilih'),
  status_pegawai: z.enum(['Aktif', 'Tidak Aktif', 'Pensiun']),

  pendidikan: z.string().optional().nullable(),
  bidang_ilmu: z.string().optional().nullable(),
  tmt: z.string().optional().nullable(),
  foto: z.string().optional().nullable(),
});
