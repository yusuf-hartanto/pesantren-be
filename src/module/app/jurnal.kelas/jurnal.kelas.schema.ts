'use strict';

import { z } from 'zod';

export const endJurnalKelasSchema = z.object({
  id_jurnal: z.string().min(1, { message: 'ID Jurnal tidak boleh kosong' }),
  materi: z.string().nullable().optional(),
  catatan: z.string().nullable().optional(),
});
