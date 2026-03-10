import { z } from 'zod';

export const jabatanSchema = z.object({
  nama_jabatan: z.string()
    .min(3, "Minimal 3 karakter")
    .max(150, "Maksimal 150 karakter"),
  id_orgunit: z.string().uuid("ID Org Unit tidak valid"),
  level_jabatan: z.coerce.number().min(1, "Level jabatan harus >= 1"), // Menggunakan coerce agar string dari form terkonversi ke number
  sifat_jabatan: z.enum(['Biro', 'Bagian', 'Lembaga', 'Sub-Unit', 'Umum']),
  kode_jabatan: z.string().min(1, "Kode jabatan wajib diisi"),
  keterangan: z.string().optional().nullable(),
});