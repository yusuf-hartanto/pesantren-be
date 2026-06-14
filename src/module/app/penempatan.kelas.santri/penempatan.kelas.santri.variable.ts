'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_santri',
      'id_kelas_mda',
      'id_kelas_formal',
      'id_tahun_ajaran',
      'tanggal_masuk',
      'tanggal_keluar',
      'status',
    ];
    return field;
  }
}

export const variable = new Variable();
