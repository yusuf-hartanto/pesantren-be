import { z } from 'zod';

// Definisi ENUM sesuai dengan model database
const GEO_TYPE = ['POINT', 'CIRCLE', 'POLYGON'] as const;

export const geoAreaSchema = z.object({
    id_lokasi: z.string().nonempty('ID Lokasi wajib diisi'),
    nama_area: z.string().max(100).nonempty('Nama Area wajib diisi'),
    tipe_geo: z.enum(GEO_TYPE).describe("Tipe Geo harus dipilih (POINT, CIRCLE, atau POLYGON)"),
    // Validasi Latitude (Hanya untuk POINT & CIRCLE)
    latitude: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.number().optional().nullable()
    ),

    // Validasi Longitude (Hanya untuk POINT & CIRCLE)
    longitude: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.number().optional().nullable()
    ),
    // Validasi Radius (Hanya untuk CIRCLE)
    radius_meter: z.preprocess(
        (val) => (val === '' ? undefined : Number(val)),
        z.number().min(0, 'Radius tidak boleh negatif').optional().nullable()
    ),
    // Validasi JSON untuk POLYGON, Menerima objek koordinat GeoJSON
    polygon_json: z.record(z.string(), z.any()).optional().nullable(),

    // Toleransi Validasi Jarak
    toleransi_meter: z.preprocess(
        (val) => (val === '' ? 0 : Number(val)),
        z.number().min(0, 'Toleransi tidak boleh negatif').default(0)
    ),

    is_active: z.boolean().default(true).optional(),
    
    keterangan: z.string().optional().nullable(),
});

/**
 * Validasi tambahan (Super Refine)
 * Menjamin field yang diisi sesuai dengan tipe_geo yang dipilih
 */
export const geoAreaFullSchema = geoAreaSchema.superRefine((data, ctx) => {
    if (data.tipe_geo === 'CIRCLE' && !data.radius_meter) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Radius wajib diisi untuk tipe CIRCLE",
            path: ["radius_meter"],
        });
    }
    
    if (data.tipe_geo === 'POLYGON' && !data.polygon_json) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Data koordinat Polygon wajib diisi",
            path: ["polygon_json"],
        });
    }

    if ((data.tipe_geo === 'POINT' || data.tipe_geo === 'CIRCLE') && (!data.latitude || !data.longitude)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Latitude dan Longitude wajib diisi untuk tipe ini",
            path: ["latitude"],
        });
    }
});

// Untuk keperluan update (Partial)
export const geoAreaUpdateSchema = geoAreaSchema.partial();