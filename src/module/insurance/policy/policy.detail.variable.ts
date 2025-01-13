'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'policy_id',
      'unit_link',
      'fund',
      'cash_value',
      'benefit',
    ];
    return field;
  }
}

export const variable = new Variable();
