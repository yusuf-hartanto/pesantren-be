'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'nama_cabang',
      'province_id',
      'city_id',
      'district_id',
      'sub_district_id',
      'contact',
      'email',
      'keterangan',
      'alamat',
      'institution_id_sitrendi',
    ];
    return field;
  }
}

export const variable = new Variable();
