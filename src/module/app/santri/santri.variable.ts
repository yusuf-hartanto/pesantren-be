'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_santri_sitrendi',
      'id_wali_sitrendi',
      'fullname',
      'nis',
      'nik',
      'gender',
      'birth_place',
      'birth_date',
      'phone',
      'institution_id',
      'institution_name',
      'group_code_1',
      'group_code_2',
      'group_code_3',
      'nomor_nasabah',
      'nomor_rekening',
      'kartu_santri',
      'status',
      'keterangan',
    ];
    return field;
  }
}

export const variable = new Variable();
