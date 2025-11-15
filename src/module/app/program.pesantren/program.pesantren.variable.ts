'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'nama_program',
      'tipe_program',
      'wajib',
      'aktif',
    ];
    return field;
  }
}

export const variable = new Variable();
