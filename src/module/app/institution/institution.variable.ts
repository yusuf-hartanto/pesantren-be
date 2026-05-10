'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = ['institution_id_sitrendi', 'status', 'institution_name', 'keterangan'];
    return field;
  }
}

export const variable = new Variable();
