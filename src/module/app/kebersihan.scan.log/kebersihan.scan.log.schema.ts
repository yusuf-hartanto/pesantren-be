import { z } from 'zod';

export const metode = ['QR', 'GPS', 'QR+GPS', 'MANUAL']
export const source = ['MOBILE', 'PWA', 'WEB']
export const kebersihanScanLogSchema = z.object({
  id_inspeksi: z.any(),
  id_lokasi: z.any(),
  id_petugas: z.any(),
  id_geo: z.any(),
  qr_code: z.any(),
  scan_latitude: z.any(),
  scan_longitude: z.any(),
  jarak_meter: z.any(),
  valid_qr: z.boolean().optional(),
  valid_geo: z.boolean().optional(),
  metode_scan: z.enum(metode, `Metode Scan wajib ${metode.join('/')}`),
  scan_source: z.enum(source, `Source Scan wajib ${source.join('/')}`),
  user_agent: z.any(),
  ip_address: z.any(),
  keterangan: z.any(),
});
