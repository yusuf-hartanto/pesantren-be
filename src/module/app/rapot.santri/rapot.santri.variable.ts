'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_santri',
      'tahun_ajaran',
      'semester',
      'file_rapot',
      'file_rapot_mda',
      'status',
    ];
    return field;
  }
}

export const variable = new Variable();
