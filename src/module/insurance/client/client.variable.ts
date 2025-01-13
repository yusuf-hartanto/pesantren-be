'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'name',
      'bod',
      'age',
      'contact_number',
      'address',
      'relation_id',
      'relation_name',
    ];
    return field;
  }
}

export const variable = new Variable();
