'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_santri',
      'nama_wali',
      'hubungan',
      'nik',
      'pendidikan',
      'pekerjaan',
      'no_hp',
      'alamat'
    ];
    return field;
  }
}

export const variable = new Variable();
