'use strict';

import { z } from 'zod';

export const createKesehatanSchema = z
  .object({
    id_santri: z
      .string()
      .uuid({ message: 'Format ID Santri harus berupa UUID' })
      .nullable()
      .optional(),

    id_pegawai: z
      .string()
      .uuid({ message: 'Format ID Pegawai harus berupa UUID' })
      .nullable()
      .optional(),

    id_lokasi_kerja: z
      .string()
      .uuid({ message: 'Format ID Lokasi Kerja harus berupa UUID' })
      .nullable()
      .optional(),

    kategori_sakit: z.enum(['Ringan', 'Sedang', 'Berat']),

    progres_status: z.enum(['Selesai', 'Dirawat', 'Dirujuk']),

    keluhan: z.string().min(1, { message: 'Keluhan tidak boleh kosong' }),

    tindakan: z.string().nullable().optional(),

    obat_diberikan: z.string().nullable().optional(),

    tanggal_mulai_rawat: z.string().nullable().optional(),

    tempat_dirawat: z.string().nullable().optional(),

    estimasi_hari: z
      .number()
      .min(1, { message: 'Estimasi hari minimal 1 hari' })
      .max(30, { message: 'Estimasi hari maksimal 30 hari' })
      .nullable()
      .optional(),

    tanggal_dirujuk: z.string().nullable().optional(),

    tempat_rujukan: z.string().nullable().optional(),

    keterangan: z.string().nullable().optional(),

    tanggal_event: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      return (
        (!!data.id_santri && !data.id_pegawai) ||
        (!data.id_santri && !!data.id_pegawai)
      );
    },
    {
      message: 'Harus diisi salah satu dari ID Santri atau ID Pegawai.',
      path: ['id_santri'],
    }
  )
  .refine(
    (data) => {
      if (data.progres_status == 'Dirawat') {
        return !!data.tanggal_mulai_rawat && !!data.tempat_dirawat;
      }
      return true;
    },
    {
      message:
        'Tanggal mulai rawat dan tempat dirawat wajib diisi jika status Dirawat',
      path: ['tanggal_mulai_rawat'],
    }
  )
  .refine(
    (data) => {
      if (data.progres_status == 'Dirujuk') {
        return (
          !!data.tanggal_dirujuk &&
          !!data.tempat_rujukan &&
          data.estimasi_hari !== null &&
          data.estimasi_hari !== undefined
        );
      }
      return true;
    },
    {
      message:
        'Tanggal dirujuk, tempat rujukan, dan estimasi hari wajib diisi jika status Dirujuk',
      path: ['tanggal_dirujuk'],
    }
  );

export const updateKesehatanSchema = z.object({
  id_santri: z
    .string()
    .uuid({ message: 'Format ID Santri harus berupa UUID' })
    .nullable()
    .optional(),

  id_pegawai: z
    .string()
    .uuid({ message: 'Format ID Pegawai harus berupa UUID' })
    .nullable()
    .optional(),

  id_lokasi_kerja: z
    .string()
    .uuid({ message: 'Format ID Lokasi Kerja harus berupa UUID' })
    .nullable()
    .optional(),

  kategori_sakit: z.enum(['Ringan', 'Sedang', 'Berat']).optional(),

  progres_status: z.enum(['Selesai', 'Dirawat', 'Dirujuk']).optional(),

  keluhan: z.string().optional(),

  tindakan: z.string().nullable().optional(),

  obat_diberikan: z.string().nullable().optional(),

  tanggal_mulai_rawat: z.string().nullable().optional(),

  tempat_dirawat: z.string().nullable().optional(),

  estimasi_hari: z
    .number()
    .nullable()
    .optional(),

  tanggal_dirujuk: z.string().nullable().optional(),

  tempat_rujukan: z.string().nullable().optional(),

  keterangan: z.string().nullable().optional(),

  tanggal_event: z.string().nullable().optional(),
});
