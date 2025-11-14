'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_santri',
      'id_program',
      'tgl_mulai',
      'tgl_selesai',
      'status',
    ];
    return field;
  }
}

export const variable = new Variable();
