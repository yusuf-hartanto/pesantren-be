'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'kode_slot',
      'jam_mulai',
      'jam_selesai',
      'is_active',
      'keterangan',
    ];
    return field;
  }
}

export const variable = new Variable();
