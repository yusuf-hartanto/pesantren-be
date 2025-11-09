'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'nama_kelpelajaran',
      'nomor_urut',
      'keterangan',
      'status',
    ];
    return field;
  }
}

export const variable = new Variable();
