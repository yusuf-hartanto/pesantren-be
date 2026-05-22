'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_cabang',
      'id_lokasi',
      'id_petugas',
      'id_jadwal',
      'tanggal',
      'waktu',
      'kode_slot',
      'status_kondisi',
      'catatan_umum',
    ];
    return field;
  }
}

export const variable = new Variable();
