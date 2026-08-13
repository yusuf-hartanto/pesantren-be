'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_santri',
      'id_lokasi',
      'id_tahunajaran',
      'tanggal_masuk',
      'tanggal_keluar',
      'id_waliasuh',
      'status',
      'keterangan',
    ];
    return field;
  }
}

export const variable = new Variable();
