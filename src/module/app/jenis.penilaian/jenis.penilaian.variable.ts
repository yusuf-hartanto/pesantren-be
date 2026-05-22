'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_penilaian', // Diizinkan untuk mapping jika diperlukan
      'singkatan',
      'jenis_pengujian', // Wajib (Unique per lembaga_type)
      'lembaga_type', // Wajib (FORMAL/PESANTREN)
      'is_ujian', // Wajib (0/1)
      'status', // Default: active
      'keterangan',
      'created_at',
      'updated_at',
    ];

    return field;
  }
}

export const variable = new Variable();
