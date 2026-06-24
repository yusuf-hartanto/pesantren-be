'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_jadwal',
      'id_guru_asli',
      'id_guru_pengganti',
      'tanggal',
      'alasan',
      'status_approval',
    ];
    return field;
  }
}

export const variable = new Variable();
