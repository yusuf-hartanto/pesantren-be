'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'param_key',
      'param_value',
      'param_desc',
      'status',
    ];
    return field;
  }
}

export const variable = new Variable();
