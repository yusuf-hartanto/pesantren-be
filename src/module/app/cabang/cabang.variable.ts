'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'nama_cabang',
      'nomor_urut',
      'keterangan',
      'alamat'
    ];
    return field;
  }
}

export const variable = new Variable();
