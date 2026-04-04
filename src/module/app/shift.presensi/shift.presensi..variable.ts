'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'kode_shift',
      'nama_shift',
      'kategori_shift',
      'waktu_mulai',
      'waktu_selesai',
      'toleransi_menit',
      'is_wajib',
      'keterangan',
      'status',
    ];
    return field;
  }
}

export const variable = new Variable();
