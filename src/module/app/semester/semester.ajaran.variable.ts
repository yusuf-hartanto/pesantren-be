'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'nama_semester',
      'nomor_urut',
      'keterangan',
      'status',
      'id_tahunajaran',
    ];
    return field;
  }
}

export const variable = new Variable();
