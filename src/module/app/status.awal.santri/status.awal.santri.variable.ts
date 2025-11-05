'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'kode_statawal',
      'nama_statawal',
      'nomor_urut',
      'keterangan',
      'status',
    ];
    return field;
  }
}

export const variable = new Variable();
