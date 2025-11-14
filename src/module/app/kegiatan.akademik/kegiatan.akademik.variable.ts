'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'nama_kegiatan',
      'id_tahunajaran',
      'id_semester',
      'id_lembaga_formal',
      'id_lembaga_pesantren',
      'id_cabang',
      'tanggal_mulai',
      'tanggal_selesai',
      'keterangan',
      'status',
      'berlaku_untuk',
    ];
    return field;
  }
}

export const variable = new Variable();
