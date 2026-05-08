'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_inspeksi',
      'kategori',
      'deskripsi',
      'tingkat',
      'perlu_tindak_lanjut',
      'foto_path',
    ];
    return field;
  }
}

export const variable = new Variable();
