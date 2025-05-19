'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'role_id',
      'username',
      'email',
      'password',
      'full_name',
      'place_of_birth',
      'date_of_birth',
      'telepon',
      'image_foto',
      'status',
      'area_province_id',
      'area_regencies_id',
    ];
    return field;
  }
}

export const variable = new Variable();
