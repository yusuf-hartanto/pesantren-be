'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'fullname',
      'nis',
      'nik',
      'gender',
      'birth_place',
      'birth_date',
      'phone',
      'id_cabang',
      'nama_cabang',
      'id_institution',
      'institution_name',
      'group_code_1',
      'group_code_2',
      'group_code_3',
      'nomor_nasabah',
      'kartu_santri_nomor',
      'kartu_santri',
      'status',
      'created_at',
      'updated_at',
      'id_santri_sitrendi',
      'id_wali_sitrendi',
      'institution_id_sitrendi',
    ];
    return field;
  }
}

export const variable = new Variable();
