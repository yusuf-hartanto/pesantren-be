'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_kelas',
      'id_kelas_mda',
      'id_gmapel',
      'id_tahunajaran',
      'id_jam_pelajaran',
      'id_semester',
      'id_lokasi',
      'hari',
      'keterangan',
      'status',
    ];
    return field;
  }
}

export const variable = new Variable();
