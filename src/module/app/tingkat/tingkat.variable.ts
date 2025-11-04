'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'tingkat',
      'nomor_urut',
      'keterangan',
    ];
    return field;
  }
}

export const variable = new Variable();
