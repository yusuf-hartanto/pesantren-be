'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_cabang',
      'nama_asrama',
      'jumlah_kamar',
      'keterangan',
    ];
    return field;
  }
}

export const variable = new Variable();
