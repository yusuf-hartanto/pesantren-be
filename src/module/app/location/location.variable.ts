'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_lokasi',
      'nama_lokasi',
      'jenis_lokasi',
      'parent_id',
      'id_cabang',
      'latitude',
      'longitude',
      'map_zoom',
      'kode_lokasi',
      'qr_code',
      'kapasitas',
      'lantai',
      'keterangan',
    ];
    return field;
  }
}

export const variable = new Variable();