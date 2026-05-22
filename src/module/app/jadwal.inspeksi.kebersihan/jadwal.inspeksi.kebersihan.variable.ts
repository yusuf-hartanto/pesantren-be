'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_cabang',
      'id_petugas',
      'kode_slot',
      'hari',
      'is_active',
      'keterangan',
    ];
    return field;
  }
}

export const variable = new Variable();
