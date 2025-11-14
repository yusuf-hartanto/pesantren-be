'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'nama_lembaga',
      'nomor_urut',
      'id_cabang',
      'jenis_pendidikan',
      'keterangan',
      'alamat'
    ];
    return field;
  }
}

export const variable = new Variable();
